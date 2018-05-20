/// <reference path="../References.d.ts"/>
import * as React from 'react';
import * as VpcTypes from '../types/VpcTypes';
import * as OrganizationTypes from '../types/OrganizationTypes';
import VpcsStore from '../stores/VpcsStore';
import OrganizationsStore from '../stores/OrganizationsStore';
import * as VpcActions from '../actions/VpcActions';
import * as OrganizationActions from '../actions/OrganizationActions';
import Vpc from './Vpc';
import VpcsFilter from './VpcsFilter';
import VpcsPage from './VpcsPage';
import Page from './Page';
import PageHeader from './PageHeader';
import NonState from './NonState';
import DatacentersStore from "../stores/DatacentersStore";
import * as DatacenterActions from "../actions/DatacenterActions";
import * as DatacenterTypes from "../types/DatacenterTypes";

interface Selected {
	[key: string]: boolean;
}

interface Opened {
	[key: string]: boolean;
}

interface State {
	vpcs: VpcTypes.VpcsRo;
	filter: VpcTypes.Filter;
	datacenters: DatacenterTypes.DatacentersRo;
	organizations: OrganizationTypes.OrganizationsRo;
	network: string;
	datacenter: string;
	organization: string;
	selected: Selected;
	opened: Opened;
	newOpened: boolean;
	lastSelected: string;
	disabled: boolean;
}

const css = {
	items: {
		width: '100%',
		marginTop: '-5px',
		display: 'table',
		borderSpacing: '0 5px',
	} as React.CSSProperties,
	itemsBox: {
		width: '100%',
		overflowY: 'auto',
	} as React.CSSProperties,
	group: {
		width: '100%',
	} as React.CSSProperties,
	groupBox: {
		margin: '16px 0 0 0',
		width: '100%',
		maxWidth: '420px',
	} as React.CSSProperties,
	placeholder: {
		opacity: 0,
		width: '100%',
	} as React.CSSProperties,
	header: {
		marginTop: '-19px',
	} as React.CSSProperties,
	heading: {
		margin: '19px 0 0 0',
	} as React.CSSProperties,
	input: {
		width: '107px',
	} as React.CSSProperties,
	select: {
		width: '100%',
	} as React.CSSProperties,
	selectFirst: {
		width: '100%',
		borderTopLeftRadius: '3px',
		borderBottomLeftRadius: '3px',
	} as React.CSSProperties,
	selectInner: {
		width: '100%',
	} as React.CSSProperties,
	selectBox: {
		flex: '1',
	} as React.CSSProperties,
	button: {
		margin: '8px 0 0 8px',
	} as React.CSSProperties,
	buttons: {
		margin: '8px 8px 0 0',
	} as React.CSSProperties,
};

export default class Vpcs extends React.Component<{}, State> {
	constructor(props: any, context: any) {
		super(props, context);
		this.state = {
			vpcs: VpcsStore.vpcs,
			filter: VpcsStore.filter,
			datacenters: DatacentersStore.datacenters,
			organizations: OrganizationsStore.organizations,
			network: '',
			organization: '',
			datacenter: '',
			selected: {},
			opened: {},
			newOpened: false,
			lastSelected: null,
			disabled: false,
		};
	}

	get selected(): boolean {
		return !!Object.keys(this.state.selected).length;
	}

	get opened(): boolean {
		return !!Object.keys(this.state.opened).length;
	}

	componentDidMount(): void {
		VpcsStore.addChangeListener(this.onChange);
		DatacentersStore.addChangeListener(this.onChange);
		OrganizationsStore.addChangeListener(this.onChange);
		VpcActions.sync();
		DatacenterActions.sync();
		OrganizationActions.sync();
	}

	componentWillUnmount(): void {
		VpcsStore.removeChangeListener(this.onChange);
		DatacentersStore.removeChangeListener(this.onChange);
		OrganizationsStore.removeChangeListener(this.onChange);
	}

	onChange = (): void => {
		let vpcs = VpcsStore.vpcs;
		let selected: Selected = {};
		let curSelected = this.state.selected;
		let opened: Opened = {};
		let curOpened = this.state.opened;

		vpcs.forEach((vpc: VpcTypes.Vpc): void => {
			if (curSelected[vpc.id]) {
				selected[vpc.id] = true;
			}
			if (curOpened[vpc.id]) {
				opened[vpc.id] = true;
			}
		});

		this.setState({
			...this.state,
			vpcs: vpcs,
			filter: VpcsStore.filter,
			datacenters: DatacentersStore.datacenters,
			organizations: OrganizationsStore.organizations,
			selected: selected,
			opened: opened,
		});
	}

	onDelete = (): void => {
		this.setState({
			...this.state,
			disabled: true,
		});
		VpcActions.removeMulti(
				Object.keys(this.state.selected)).then((): void => {
			this.setState({
				...this.state,
				selected: {},
				disabled: false,
			});
		}).catch((): void => {
			this.setState({
				...this.state,
				disabled: false,
			});
		});
	}

	render(): JSX.Element {
		let vpcsDom: JSX.Element[] = [];

		let hasOrganizations = false;
		let organizationsSelect: JSX.Element[] = [];
		if (this.state.organizations.length) {
			hasOrganizations = true;
			for (let organization of this.state.organizations) {
				organizationsSelect.push(
					<option
						key={organization.id}
						value={organization.id}
					>{organization.name}</option>,
				);
			}
		} else {
			organizationsSelect.push(
				<option
					key="null"
					value=""
				>No Organizations</option>,
			);
		}

		let hasDatacenters = false;
		let datacentersSelect: JSX.Element[] = [];
		if (this.state.datacenters.length) {
			hasDatacenters = true;
			for (let datacenter of this.state.datacenters) {
				datacentersSelect.push(
					<option
						key={datacenter.id}
						value={datacenter.id}
					>{datacenter.name}</option>,
				);
			}
		} else {
			datacentersSelect.push(
				<option
					key="null"
					value=""
				>No Datacenters</option>,
			);
		}

		this.state.vpcs.forEach((
				vpc: VpcTypes.VpcRo): void => {
			vpcsDom.push(<Vpc
				key={vpc.id}
				vpc={vpc}
				datacenters={this.state.datacenters}
				organizations={this.state.organizations}
				selected={!!this.state.selected[vpc.id]}
				open={!!this.state.opened[vpc.id]}
				onSelect={(shift: boolean): void => {
					let selected = {
						...this.state.selected,
					};

					if (shift) {
						let vpcs = this.state.vpcs;
						let start: number;
						let end: number;

						for (let i = 0; i < vpcs.length; i++) {
							let usr = vpcs[i];

							if (usr.id === vpc.id) {
								start = i;
							} else if (usr.id === this.state.lastSelected) {
								end = i;
							}
						}

						if (start !== undefined && end !== undefined) {
							if (start > end) {
								end = [start, start = end][0];
							}

							for (let i = start; i <= end; i++) {
								selected[vpcs[i].id] = true;
							}

							this.setState({
								...this.state,
								lastSelected: vpc.id,
								selected: selected,
							});

							return;
						}
					}

					if (selected[vpc.id]) {
						delete selected[vpc.id];
					} else {
						selected[vpc.id] = true;
					}

					this.setState({
						...this.state,
						lastSelected: vpc.id,
						selected: selected,
					});
				}}
				onOpen={(): void => {
					let opened = {
						...this.state.opened,
					};

					if (opened[vpc.id]) {
						delete opened[vpc.id];
					} else {
						opened[vpc.id] = true;
					}

					this.setState({
						...this.state,
						opened: opened,
					});
				}}
			/>);
		});

		let filterClass = 'pt-button pt-intent-primary pt-icon-filter ';
		if (this.state.filter) {
			filterClass += 'pt-active';
		}

		return <Page>
			<PageHeader>
				<div className="layout horizontal wrap" style={css.header}>
					<h2 style={css.heading}>VPCs</h2>
					<div className="flex"/>
					<div style={css.buttons}>
						<button
							className={filterClass}
							style={css.button}
							type="button"
							onClick={(): void => {
								if (this.state.filter === null) {
									VpcActions.filter({});
								} else {
									VpcActions.filter(null);
								}
							}}
						>
							Filters
						</button>
					</div>
					<div style={Constants.user ? css.groupBoxUser : css.groupBox}>
						<div
							className="pt-control-group"
							style={css.group}
						>
							<input
								className="pt-input"
								style={css.input}
								type="text"
								disabled={!hasOrganizations || this.state.disabled}
								autoCapitalize="off"
								spellCheck={false}
								placeholder="Enter network"
								value={this.state.network}
								onChange={(evt): void => {
									this.setState({
										...this.state,
										network: evt.target.value,
									});
								}}
							/>
							<div style={css.selectBox}>
								<div className="pt-select" style={css.selectFirst}>
									<select
										style={css.selectInner}
										disabled={!hasOrganizations || this.state.disabled}
										value={this.state.organization}
										onChange={(evt): void => {
											this.setState({
												...this.state,
												organization: evt.target.value,
											});
										}}
									>
										{organizationsSelect}
									</select>
								</div>
							</div>
							<div style={css.selectBox}>
								<div className="pt-select" style={css.select}>
									<select
										style={css.selectInner}
										disabled={!hasDatacenters || this.state.disabled}
										value={this.state.datacenter}
										onChange={(evt): void => {
											this.setState({
												...this.state,
												datacenter: evt.target.value,
											});
										}}
									>
										{datacentersSelect}
									</select>
								</div>
							</div>
							<button
								className="pt-button pt-intent-success pt-icon-add"
								disabled={!hasDatacenters || !hasOrganizations ||
									this.state.disabled}
								type="button"
								onClick={(): void => {
									this.setState({
										...this.state,
										disabled: true,
									});
									VpcActions.create({
										id: null,
										network: this.state.network,
										organization: this.state.organization ||
											this.state.organizations[0].id,
										datacenter: this.state.datacenter ||
											this.state.datacenters[0].id,
									}).then((): void => {
										this.setState({
											...this.state,
											network: '',
											disabled: false,
										});
									}).catch((): void => {
										this.setState({
											...this.state,
											disabled: false,
										});
									});
								}}
							>New</button>
						</div>
					</div>
				</div>
			</PageHeader>
			<VpcsFilter
				filter={this.state.filter}
				onFilter={(filter): void => {
					VpcActions.filter(filter);
				}}
				organizations={this.state.organizations}
				datacenters={this.state.datacenters}
			/>
			<div style={css.itemsBox}>
				<div style={css.items}>
					{vpcsDom}
					<tr className="pt-card pt-row" style={css.placeholder}>
						<td colSpan={5} style={css.placeholder}/>
					</tr>
				</div>
			</div>
			<NonState
				hidden={!!vpcsDom.length}
				iconClass="pt-icon-layout-auto"
				title="No vpcs"
				description="Add a new vpc to get started."
			/>
			<VpcsPage
				onPage={(): void => {
					this.setState({
						lastSelected: null,
					});
				}}
			/>
		</Page>;
	}
}
