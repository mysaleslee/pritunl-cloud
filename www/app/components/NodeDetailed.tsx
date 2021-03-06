/// <reference path="../References.d.ts"/>
import * as React from 'react';
import * as NodeTypes from '../types/NodeTypes';
import * as CertificateTypes from '../types/CertificateTypes';
import * as DatacenterTypes from "../types/DatacenterTypes";
import * as ZoneTypes from '../types/ZoneTypes';
import * as NodeActions from '../actions/NodeActions';
import * as BlockTypes from '../types/BlockTypes';
import * as MiscUtils from '../utils/MiscUtils';
import CertificatesStore from '../stores/CertificatesStore';
import PageInput from './PageInput';
import PageSwitch from './PageSwitch';
import PageInputSwitch from './PageInputSwitch';
import PageSelect from './PageSelect';
import PageSelectButton from './PageSelectButton';
import PageInputButton from './PageInputButton';
import PageTextArea from './PageTextArea';
import PageInfo from './PageInfo';
import PageSave from './PageSave';
import NodeBlock from './NodeBlock';
import ConfirmButton from './ConfirmButton';
import Help from './Help';

interface Props {
	node: NodeTypes.NodeRo;
	certificates: CertificateTypes.CertificatesRo;
	datacenters: DatacenterTypes.DatacentersRo;
	zones: ZoneTypes.ZonesRo;
	blocks: BlockTypes.BlocksRo;
	selected: boolean;
	onSelect: (shift: boolean) => void;
	onClose: () => void;
}

interface State {
	disabled: boolean;
	datacenter: string;
	zone: string;
	changed: boolean;
	message: string;
	node: NodeTypes.Node;
	addExternalIface: string;
	addInternalIface: string;
	addCert: string;
	addNetworkRole: string;
	addHostNatExclude: string,
	addDrive: string;
	forwardedChecked: boolean;
	forwardedProtoChecked: boolean;
}

const css = {
	card: {
		position: 'relative',
		padding: '48px 10px 0 10px',
		width: '100%',
	} as React.CSSProperties,
	button: {
		height: '30px',
	} as React.CSSProperties,
	buttons: {
		cursor: 'pointer',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		padding: '4px',
		height: '39px',
		backgroundColor: 'rgba(0, 0, 0, 0.13)',
	} as React.CSSProperties,
	item: {
		margin: '9px 5px 0 5px',
		wordBreak: 'break-all',
	} as React.CSSProperties,
	itemsLabel: {
		display: 'block',
	} as React.CSSProperties,
	itemsAdd: {
		margin: '8px 0 15px 0',
	} as React.CSSProperties,
	group: {
		flex: 1,
		minWidth: '280px',
		margin: '0 10px',
	} as React.CSSProperties,
	save: {
		paddingBottom: '10px',
	} as React.CSSProperties,
	restart: {
		marginRight: '10px',
	} as React.CSSProperties,
	label: {
		width: '100%',
		maxWidth: '280px',
	} as React.CSSProperties,
	inputGroup: {
		width: '100%',
	} as React.CSSProperties,
	protocol: {
		minWidth: '90px',
		flex: '0 1 auto',
	} as React.CSSProperties,
	port: {
		minWidth: '120px',
		flex: '1',
	} as React.CSSProperties,
	select: {
		margin: '7px 0px 0px 6px',
		paddingTop: '3px',
	} as React.CSSProperties,
	role: {
		margin: '9px 5px 0 5px',
		height: '20px',
	} as React.CSSProperties,
	blocks: {
		marginBottom: '15px',
	} as React.CSSProperties,
};

export default class NodeDetailed extends React.Component<Props, State> {
	constructor(props: any, context: any) {
		super(props, context);
		this.state = {
			disabled: false,
			datacenter: '',
			zone: '',
			changed: false,
			message: '',
			node: null,
			addExternalIface: null,
			addInternalIface: null,
			addCert: null,
			addNetworkRole: null,
			addHostNatExclude: null,
			addDrive: null,
			forwardedChecked: false,
			forwardedProtoChecked: false,
		};
	}

	set(name: string, val: any): void {
		let node: any;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		node[name] = val;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	toggleFirewall(): void {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		node.firewall = !node.firewall;
		if (!node.firewall) {
			node.network_roles = [];
		}

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	toggleType(typ: string): void {
		let node: NodeTypes.Node = this.state.node || this.props.node;

		let vals = node.types;

		let i = vals.indexOf(typ);
		if (i === -1) {
			vals.push(typ);
		} else {
			vals.splice(i, 1);
		}

		vals = vals.filter((val): boolean => {
			return !!val;
		});

		vals.sort();

		this.set('types', vals);
	}

	ifaces(): string[] {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let zoneId = node.zone;
		if (this.state.zone) {
			zoneId = this.state.zone;
		}

		let vxlan = false;
		for (let zne of this.props.zones) {
			if (zne.id === zoneId) {
				if (zne.network_mode === 'vxlan_vlan') {
					vxlan = true;
				}
				break;
			}
		}

		if (vxlan) {
			return node.available_bridges.concat(node.available_interfaces);
		} else {
			return node.available_bridges;
		}
	}

	onAddNetworkRole = (): void => {
		let node: NodeTypes.Node;

		if (!this.state.addNetworkRole) {
			return;
		}

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let networkRoles = [
			...(node.network_roles || []),
		];

		if (networkRoles.indexOf(this.state.addNetworkRole) === -1) {
			networkRoles.push(this.state.addNetworkRole);
		}

		networkRoles.sort();
		node.network_roles = networkRoles;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addNetworkRole: '',
			node: node,
		});
	}

	onRemoveNetworkRole = (networkRole: string): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let networkRoles = [
			...(node.network_roles || []),
		];

		let i = networkRoles.indexOf(networkRole);
		if (i === -1) {
			return;
		}

		networkRoles.splice(i, 1);
		node.network_roles = networkRoles;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addNetworkRole: '',
			node: node,
		});
	}

	onSave = (): void => {
		this.setState({
			...this.state,
			disabled: true,
		});

		let node = {
			...this.state.node,
		};

		if (!this.props.node.zone) {
			let zone = this.state.zone;
			if (!zone && this.props.datacenters.length &&
					this.props.zones.length) {
				let datacenter = this.state.datacenter ||
					this.props.datacenters[0].id;
				for (let zne of this.props.zones) {
					if (zne.datacenter === datacenter) {
						zone = zne.id;
					}
				}
			}

			if (zone) {
				node.zone = zone;
			}
		}

		NodeActions.commit(node).then((): void => {
			this.setState({
				...this.state,
				message: 'Your changes have been saved',
				changed: false,
				disabled: false,
			});

			setTimeout((): void => {
				if (!this.state.changed) {
					this.setState({
						...this.state,
						message: '',
						changed: false,
						node: null,
					});
				}
			}, 3000);
		}).catch((): void => {
			this.setState({
				...this.state,
				message: '',
				disabled: false,
			});
		});
	}

	operation(state: string): void {
		this.setState({
			...this.state,
			disabled: true,
		});
		NodeActions.operation(this.props.node.id, state).then((): void => {
			setTimeout((): void => {
				this.setState({
					...this.state,
					disabled: false,
				});
			}, 250);
		}).catch((): void => {
			this.setState({
				...this.state,
				disabled: false,
			});
		});
	}

	onDelete = (): void => {
		this.setState({
			...this.state,
			disabled: true,
		});
		NodeActions.remove(this.props.node.id).then((): void => {
			this.setState({
				...this.state,
				disabled: false,
			});
		}).catch((): void => {
			this.setState({
				...this.state,
				disabled: false,
			});
		});
	}

	onAddExternalIface = (): void => {
		let node: NodeTypes.Node;

		if (!this.state.addExternalIface &&
			!this.props.node.available_bridges.length) {
			return;
		}

		let certId = this.state.addExternalIface ||
			this.props.node.available_bridges[0];

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let ifaces = [
			...(node.external_interfaces || []),
		];

		if (ifaces.indexOf(certId) === -1) {
			ifaces.push(certId);
		}

		ifaces.sort();

		node.external_interfaces = ifaces;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	onRemoveExternalIface = (iface: string): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let ifaces = [
			...(node.external_interfaces || []),
		];

		let i = ifaces.indexOf(iface);
		if (i === -1) {
			return;
		}

		ifaces.splice(i, 1);

		node.external_interfaces = ifaces;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	onAddInternalIface = (): void => {
		let node: NodeTypes.Node;
		let availableIfaces = this.ifaces();

		if (!this.state.addInternalIface && !availableIfaces.length) {
			return;
		}

		let index = this.state.addInternalIface || availableIfaces[0];

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let ifaces = [
			...(node.internal_interfaces || []),
		];

		if (ifaces.indexOf(index) === -1) {
			ifaces.push(index);
		}

		ifaces.sort();

		node.internal_interfaces = ifaces;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	onRemoveInternalIface = (iface: string): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let ifaces = [
			...(node.internal_interfaces || []),
		];

		let i = ifaces.indexOf(iface);
		if (i === -1) {
			return;
		}

		ifaces.splice(i, 1);

		node.internal_interfaces = ifaces;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	onAddCert = (): void => {
		let node: NodeTypes.Node;

		if (!this.state.addCert && !this.props.certificates.length) {
			return;
		}

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let certId = this.state.addCert;
		if (!certId) {
			for (let certificate of this.props.certificates) {
				if (certificate.organization) {
					continue;
				}
				certId = certificate.id;
				break;
			}
		}

		let certificates = [
			...(node.certificates || []),
		];

		if (certificates.indexOf(certId) === -1) {
			certificates.push(certId);
		}

		certificates.sort();

		node.certificates = certificates;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	onRemoveCert = (certId: string): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let certificates = [
			...(node.certificates || []),
		];

		let i = certificates.indexOf(certId);
		if (i === -1) {
			return;
		}

		certificates.splice(i, 1);

		node.certificates = certificates;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	newBlock = (ipv6: boolean): NodeTypes.BlockAttachment => {
		let defBlock = '';

		for (let block of (this.props.blocks || [])) {
			if ((ipv6 && block.type === 'ipv6') ||
					(!ipv6 && block.type === 'ipv4')) {
				defBlock = block.id;
			}
		}

		return {
			interface: this.props.node.available_bridges[0],
			block: defBlock,
		} as NodeTypes.BlockAttachment;
	}

	onNetworkMode = (mode: string): void => {
		let node: any;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		if (mode === 'static' && (node.blocks || []).length === 0) {
			node.blocks = [
				this.newBlock(false),
			];
		}

		node.network_mode = mode;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	onNetworkMode6 = (mode: string): void => {
		let node: any;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		if (mode === 'static' && (node.blocks6 || []).length === 0) {
			node.blocks6 = [
				this.newBlock(true),
			];
		}

		node.network_mode6 = mode;

		this.setState({
			...this.state,
			changed: true,
			node: node,
		});
	}

	onAddBlock = (i: number): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let blocks = [
			...node.blocks,
		];

		blocks.splice(i + 1, 0, this.newBlock(false));
		node.blocks = blocks;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			node: node,
		});
	}

	onChangeBlock(i: number, block: NodeTypes.BlockAttachment): void {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let blocks = [
			...node.blocks,
		];

		blocks[i] = block;

		node.blocks = blocks;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			node: node,
		});
	}

	onRemoveBlock(i: number): void {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let blocks = [
			...node.blocks,
		];

		blocks.splice(i, 1);

		if (!blocks.length) {
			blocks = [
				this.newBlock(false),
			];
		}

		node.blocks = blocks;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			node: node,
		});
	}

	onAddBlock6 = (i: number): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let blocks = [
			...node.blocks6,
		];

		blocks.splice(i + 1, 0, this.newBlock(true));
		node.blocks6 = blocks;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			node: node,
		});
	}

	onChangeBlock6(i: number, block: NodeTypes.BlockAttachment): void {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let blocks = [
			...node.blocks6,
		];

		blocks[i] = block;

		node.blocks6 = blocks;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			node: node,
		});
	}

	onRemoveBlock6(i: number): void {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let blocks = [
			...node.blocks6,
		];

		blocks.splice(i, 1);

		if (!blocks.length) {
			blocks = [
				this.newBlock(true),
			];
		}

		node.blocks6 = blocks;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			node: node,
		});
	}

	onAddHostNatExclude = (): void => {
		let node: NodeTypes.Node;

		if (!this.state.addHostNatExclude) {
			return;
		}

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let hostNatExcludes = [
			...(node.host_nat_excludes || []),
		];

		let addHostNatExclude = this.state.addHostNatExclude.trim();
		if (hostNatExcludes.indexOf(addHostNatExclude) === -1) {
			hostNatExcludes.push(addHostNatExclude);
		}

		hostNatExcludes.sort();
		node.host_nat_excludes = hostNatExcludes;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addHostNatExclude: '',
			node: node,
		});
	}

	onRemoveHostNatExclude = (exclude: string): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let hostNatExcludes = [
			...(node.host_nat_excludes || []),
		];

		let i = hostNatExcludes.indexOf(exclude);
		if (i === -1) {
			return;
		}

		hostNatExcludes.splice(i, 1);
		node.host_nat_excludes = hostNatExcludes;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addHostNatExclude: '',
			node: node,
		});
	}

	onAddDrive = (): void => {
		let node: NodeTypes.Node;
		let availabeDrives = this.props.node.available_drives || [];

		if (!this.state.addDrive && !availabeDrives.length) {
			return;
		}

		let addDrive = this.state.addDrive;
		if (!addDrive) {
			addDrive = availabeDrives[0].id;
		}

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let instanceDrives = [
			...(node.instance_drives || []),
		];

		let index = -1;
		for (let i = 0; i < instanceDrives.length; i++) {
			let dev = instanceDrives[i];
			if (dev.id === addDrive) {
				index = i;
				break
			}
		}

		if (index === -1) {
			instanceDrives.push({
				id: addDrive,
			});
		}

		node.instance_drives = instanceDrives;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addDrive: '',
			node: node,
		});
	}

	onRemoveDrive = (device: string): void => {
		let node: NodeTypes.Node;

		if (this.state.changed) {
			node = {
				...this.state.node,
			};
		} else {
			node = {
				...this.props.node,
			};
		}

		let instanceDrives = [
			...(node.instance_drives || []),
		];

		let index = -1;
		for (let i = 0; i < instanceDrives.length; i++) {
			let dev = instanceDrives[i];
			if (dev.id === device) {
				index = i;
				break
			}
		}
		if (index === -1) {
			return;
		}

		instanceDrives.splice(index, 1);
		node.instance_drives = instanceDrives;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addDrive: '',
			node: node,
		});
	}

	render(): JSX.Element {
		let node: NodeTypes.Node = this.state.node || this.props.node;
		let active = node.requests_min !== 0 || node.memory !== 0 ||
				node.load1 !== 0 || node.load5 !== 0 || node.load15 !== 0;
		let types = node.types || [];

		let publicIps: any = this.props.node.public_ips;
		if (!publicIps || !publicIps.length) {
			publicIps = 'None';
		}

		let publicIps6: any = this.props.node.public_ips6;
		if (!publicIps6 || !publicIps6.length) {
			publicIps6 = 'None';
		}

		let externalIfaces: JSX.Element[] = [];
		for (let iface of (node.external_interfaces || [])) {
			externalIfaces.push(
				<div
					className="bp3-tag bp3-tag-removable bp3-intent-primary"
					style={css.item}
					key={iface}
				>
					{iface}
					<button
						disabled={this.state.disabled}
						className="bp3-tag-remove"
						onMouseUp={(): void => {
							this.onRemoveExternalIface(iface);
						}}
					/>
				</div>,
			);
		}

		let internalIfaces: JSX.Element[] = [];
		for (let iface of (node.internal_interfaces || [])) {
			internalIfaces.push(
				<div
					className="bp3-tag bp3-tag-removable bp3-intent-primary"
					style={css.item}
					key={iface}
				>
					{iface}
					<button
						disabled={this.state.disabled}
						className="bp3-tag-remove"
						onMouseUp={(): void => {
							this.onRemoveInternalIface(iface);
						}}
					/>
				</div>,
			);
		}

		let externalIfacesSelect: JSX.Element[] = [];
		for (let iface of (this.props.node.available_bridges || [])) {
			externalIfacesSelect.push(
				<option key={iface} value={iface}>
					{iface}
				</option>,
			);
		}

		let availableIfaces = this.ifaces();
		let internalIfacesSelect: JSX.Element[] = [];
		for (let iface of (availableIfaces || [])) {
			internalIfacesSelect.push(
				<option key={iface} value={iface}>
					{iface}
				</option>,
			);
		}

		let hostBlocksSelect: JSX.Element[] = [
			<option key="null" value="">
				Disabled
			</option>,
		];
		for (let blck of (this.props.blocks || [])) {
			if (blck.type !== 'ipv4') {
				continue;
			}

			hostBlocksSelect.push(
				<option key={blck.id} value={blck.id}>
					{blck.name}
				</option>,
			);
		}

		let hostNatExcludes: JSX.Element[] = [];
		for (let hostNatExclude of (node.host_nat_excludes || [])) {
			hostNatExcludes.push(
				<div
					className="bp3-tag bp3-tag-removable bp3-intent-primary"
					style={css.item}
					key={hostNatExclude}
				>
					{hostNatExclude}
					<button
						className="bp3-tag-remove"
						disabled={this.state.disabled}
						onMouseUp={(): void => {
							this.onRemoveHostNatExclude(hostNatExclude);
						}}
					/>
				</div>,
			);
		}

		let availableDrives: JSX.Element[] = [];
		for (let device of (node.instance_drives || [])) {
			availableDrives.push(
				<div
					className="bp3-tag bp3-tag-removable bp3-intent-primary"
					style={css.item}
					key={device.id}
				>
					{device.id}
					<button
						disabled={this.state.disabled}
						className="bp3-tag-remove"
						onMouseUp={(): void => {
							this.onRemoveDrive(device.id);
						}}
					/>
				</div>,
			);
		}

		let availableDrivesSelect: JSX.Element[] = [];
		for (let device of (node.available_drives || [])) {
			availableDrivesSelect.push(
				<option key={device.id} value={device.id}>
					{device.id}
				</option>,
			);
		}

		let certificates: JSX.Element[] = [];
		for (let certId of (node.certificates || [])) {
			let cert = CertificatesStore.certificate(certId);
			if (!cert) {
				continue;
			}

			certificates.push(
				<div
					className="bp3-tag bp3-tag-removable bp3-intent-primary"
					style={css.item}
					key={cert.id}
				>
					{cert.name}
					<button
						disabled={this.state.disabled}
						className="bp3-tag-remove"
						onMouseUp={(): void => {
							this.onRemoveCert(cert.id);
						}}
					/>
				</div>,
			);
		}

		let hasCertificates = false;
		let certificatesSelect: JSX.Element[] = [];
		if (this.props.certificates.length) {
			for (let certificate of this.props.certificates) {
				if (certificate.organization) {
					continue;
				}
				hasCertificates = true;

				certificatesSelect.push(
					<option key={certificate.id} value={certificate.id}>
						{certificate.name}
					</option>,
				);
			}
		}

		if (!hasCertificates) {
			certificatesSelect = [
				<option key="null" value="">
					No Certificates
				</option>,
			];
		}

		let defaultDatacenter = '';
		let hasDatacenters = false;
		let datacentersSelect: JSX.Element[] = [];
		if (this.props.datacenters.length) {
			hasDatacenters = true;
			defaultDatacenter = this.props.datacenters[0].id;
			for (let datacenter of this.props.datacenters) {
				datacentersSelect.push(
					<option
						key={datacenter.id}
						value={datacenter.id}
					>{datacenter.name}</option>,
				);
			}
		}

		if (!hasDatacenters) {
			datacentersSelect.push(
				<option key="null" value="">No Datacenters</option>);
		}

		let datacenter = this.state.datacenter || defaultDatacenter;
		let hasZones = false;
		let zonesSelect: JSX.Element[] = [];
		if (this.props.zones.length) {
			zonesSelect.push(<option key="null" value="">Select Zone</option>);

			for (let zone of this.props.zones) {
				if (!this.props.node.zone && zone.datacenter !== datacenter) {
					continue;
				}
				hasZones = true;

				zonesSelect.push(
					<option
						key={zone.id}
						value={zone.id}
					>{zone.name}</option>,
				);
			}
		}

		if (!hasZones) {
			zonesSelect = [<option key="null" value="">No Zones</option>];
		}

		let networkRoles: JSX.Element[] = [];
		for (let networkRole of (node.network_roles || [])) {
			networkRoles.push(
				<div
					className="bp3-tag bp3-tag-removable bp3-intent-primary"
					style={css.role}
					key={networkRole}
				>
					{networkRole}
					<button
						className="bp3-tag-remove"
						disabled={this.state.disabled}
						onMouseUp={(): void => {
							this.onRemoveNetworkRole(networkRole);
						}}
					/>
				</div>,
			);
		}

		let nodeBlocks = node.blocks || [];
		let blocks: JSX.Element[] = [];
		for (let i = 0; i < nodeBlocks.length; i++) {
			let index = i;

			blocks.push(
				<NodeBlock
					key={index}
					interfaces={this.props.node.available_bridges}
					blocks={this.props.blocks}
					block={nodeBlocks[index]}
					ipv6={false}
					onChange={(state: NodeTypes.BlockAttachment): void => {
						this.onChangeBlock(index, state);
					}}
					onAdd={(): void => {
						this.onAddBlock(index);
					}}
					onRemove={(): void => {
						this.onRemoveBlock(index);
					}}
				/>,
			);
		}

		let nodeBlocks6 = node.blocks6 || [];
		let blocks6: JSX.Element[] = [];
		for (let i = 0; i < nodeBlocks6.length; i++) {
			let index = i;

			blocks6.push(
				<NodeBlock
					key={index}
					interfaces={this.props.node.available_bridges}
					blocks={this.props.blocks}
					block={nodeBlocks6[index]}
					ipv6={true}
					onChange={(state: NodeTypes.BlockAttachment): void => {
						this.onChangeBlock6(index, state);
					}}
					onAdd={(): void => {
						this.onAddBlock6(index);
					}}
					onRemove={(): void => {
						this.onRemoveBlock6(index);
					}}
				/>,
			);
		}

		return <td
			className="bp3-cell"
			colSpan={4}
			style={css.card}
		>
			<div className="layout horizontal wrap">
				<div style={css.group}>
					<div
						className="layout horizontal"
						style={css.buttons}
						onClick={(evt): void => {
							let target = evt.target as HTMLElement;

							if (target.className.indexOf('open-ignore') !== -1) {
								return;
							}

							this.props.onClose();
						}}
					>
						<div className="flex"/>
						<ConfirmButton
							className="bp3-minimal bp3-intent-danger bp3-icon-trash open-ignore"
							progressClassName="bp3-intent-danger"
							confirmMsg="Confirm node remove"
							disabled={active || this.state.disabled}
							onConfirm={this.onDelete}
						/>
					</div>
					<PageInput
						disabled={this.state.disabled}
						label="Name"
						help="Name of node"
						type="text"
						placeholder="Enter name"
						value={node.name}
						onChange={(val): void => {
							this.set('name', val);
						}}
					/>
					<PageTextArea
						label="Comment"
						help="Node comment."
						placeholder="Node comment"
						rows={3}
						value={node.comment}
						onChange={(val: string): void => {
							this.set('comment', val);
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="Admin"
						help="Provides access to the admin console on this node."
						checked={types.indexOf('admin') !== -1}
						onToggle={(): void => {
							this.toggleType('admin');
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="User"
						help="Provides access to the user console on this node for SSH certificates."
						checked={types.indexOf('user') !== -1}
						onToggle={(): void => {
							this.toggleType('user');
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="Load Balancer"
						help="Provides access to load balancers."
						checked={types.indexOf('balancer') !== -1}
						onToggle={(): void => {
							this.toggleType('balancer');
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="Hypervisor"
						help="Run instances with hypervisor on this node."
						checked={types.indexOf('hypervisor') !== -1}
						onToggle={(): void => {
							this.toggleType('hypervisor');
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						hidden={true}
						label="Pritunl Link"
						help="Run Pritunl Link IPSec connections on this node."
						checked={types.indexOf('ipsec') !== -1}
						onToggle={(): void => {
							this.toggleType('ipsec');
						}}
					/>
					<PageInput
						disabled={this.state.disabled}
						hidden={types.indexOf('balancer') === -1 && (
							types.indexOf('admin') === -1 ||
							types.indexOf('user') === -1)}
						label="Admin Domain"
						help="Domain that will be used to access the admin interface."
						type="text"
						placeholder="Enter admin domain"
						value={node.admin_domain}
						onChange={(val): void => {
							this.set('admin_domain', val);
						}}
					/>
					<PageInput
						disabled={this.state.disabled}
						hidden={types.indexOf('balancer') === -1 && (
							types.indexOf('admin') === -1 ||
							types.indexOf('user') === -1)}
						label="User Domain"
						help="Domain that will be used to access the user interface."
						type="text"
						placeholder="Enter user domain"
						value={node.user_domain}
						onChange={(val): void => {
							this.set('user_domain', val);
						}}
					/>
					<label className="bp3-label" style={css.label}>
						Protocol and Port
						<div className="bp3-control-group" style={css.inputGroup}>
							<div className="bp3-select" style={css.protocol}>
								<select
									disabled={this.state.disabled}
									value={node.protocol || 'https'}
									onChange={(evt): void => {
										this.set('protocol', evt.target.value);
									}}
								>
									<option value="http">HTTP</option>
									<option value="https">HTTPS</option>
								</select>
							</div>
							<input
								className="bp3-input"
								disabled={this.state.disabled}
								style={css.port}
								type="text"
								autoCapitalize="off"
								spellCheck={false}
								placeholder="Port"
								value={node.port || 443}
								onChange={(evt): void => {
									this.set('port', parseInt(evt.target.value, 10));
								}}
							/>
						</div>
					</label>
					<PageSwitch
						disabled={this.state.disabled}
						label="Web redirect server"
						help="Enable redirect server for HTTP requests to HTTPS. Required for Lets Encrypt certificates."
						checked={!node.no_redirect_server}
						onToggle={(): void => {
							this.set('no_redirect_server', !node.no_redirect_server);
						}}
					/>
					<PageSelect
						disabled={this.state.disabled || !hasDatacenters}
						hidden={!!this.props.node.zone}
						label="Datacenter"
						help="Node datacenter, cannot be changed once set."
						value={this.state.datacenter}
						onChange={(val): void => {
							if (this.state.changed) {
								node = {
									...this.state.node,
								};
							} else {
								node = {
									...this.props.node,
								};
							}

							this.setState({
								...this.state,
								changed: true,
								node: node,
								datacenter: val,
								zone: '',
							});
						}}
					>
						{datacentersSelect}
					</PageSelect>
					<PageSelect
						disabled={!!this.props.node.zone || this.state.disabled ||
							!hasZones}
						label="Zone"
						help="Node zone, cannot be changed once set."
						value={this.props.node.zone ? this.props.node.zone :
							this.state.zone}
						onChange={(val): void => {
							let node: NodeTypes.Node;
							if (this.state.changed) {
								node = {
									...this.state.node,
								};
							} else {
								node = {
									...this.props.node,
								};
							}

							this.setState({
								...this.state,
								changed: true,
								node: node,
								zone: val,
							});
						}}
					>
						{zonesSelect}
					</PageSelect>
					<PageSelect
						disabled={this.state.disabled}
						label="Network Mode"
						help="Network mode for public IP addresses. Cannot be changed with instances running."
						value={node.network_mode}
						onChange={(val): void => {
							this.onNetworkMode(val);
						}}
					>
						<option value="dhcp">DHCP</option>
						<option value="static">Static</option>
						<option value="internal">Internal Only</option>
					</PageSelect>
					<label
						className="bp3-label"
						style={css.label}
						hidden={node.network_mode !== 'dhcp' && node.network_mode !== ''}
					>
						External Interfaces
						<Help
							title="External Interfaces"
							content="External interfaces for instance public interface, must be a bridge interface. Leave blank for automatic configuration."
						/>
						<div>
							{externalIfaces}
						</div>
					</label>
					<PageSelectButton
						hidden={node.network_mode !== 'dhcp' && node.network_mode !== ''}
						label="Add Interface"
						value={this.state.addExternalIface}
						disabled={!externalIfacesSelect.length || this.state.disabled}
						buttonClass="bp3-intent-success"
						onChange={(val: string): void => {
							this.setState({
								...this.state,
								addExternalIface: val,
							});
						}}
						onSubmit={this.onAddExternalIface}
					>
						{externalIfacesSelect}
					</PageSelectButton>
					<label
						className="bp3-label"
						style={css.label}
					>
						Internal Interfaces
						<Help
							title="Internal Interfaces"
							content="Internal interfaces for instance private VPC interface, must be a bridge interface. Leave blank for to use external interface."
						/>
						<div>
							{internalIfaces}
						</div>
					</label>
					<PageSelectButton
						label="Add Interface"
						value={this.state.addInternalIface}
						disabled={!internalIfacesSelect.length || this.state.disabled}
						buttonClass="bp3-intent-success"
						onChange={(val: string): void => {
							this.setState({
								...this.state,
								addInternalIface: val,
							});
						}}
						onSubmit={this.onAddInternalIface}
					>
						{internalIfacesSelect}
					</PageSelectButton>
					<label
						className="bp3-label"
						hidden={node.network_mode !== 'static'}
						style={css.label}
					>
						Internal Block Attachments
						{blocks}
					</label>
					<PageSelect
						disabled={this.state.disabled}
						label="Network IPv6 Mode"
						help="Network mode for public IPv6 addresses. Cannot be changed with instances running. Default will use IPv4 network mode."
						value={node.network_mode6}
						onChange={(val): void => {
							this.onNetworkMode6(val);
						}}
					>
						<option value="">Default</option>
						<option value="static">Static</option>
					</PageSelect>
					<label
						className="bp3-label"
						hidden={node.network_mode6 !== 'static'}
						style={css.label}
					>
						External IPv6 Block Attachments
						{blocks6}
					</label>
					<PageSelect
						disabled={this.state.disabled}
						label="Host Network Block"
						help="IP address block to use for static address on host network."
						value={node.host_block}
						onChange={(val): void => {
							this.set('host_block', val);
						}}
					>
						{hostBlocksSelect}
					</PageSelect>
					<PageSwitch
						disabled={this.state.disabled}
						hidden={!node.host_block}
						label="Host Network NAT"
						help="Enable NAT to on the host network."
						checked={node.host_nat}
						onToggle={(): void => {
							this.set('host_nat', !node.host_nat);
						}}
					/>
					<label
						className="bp3-label"
						hidden={!node.host_block || !node.host_nat}
					>
						Host Network NAT Excludes
						<Help
							title="Host network NAT excludes"
							content="Networks that will be excluded from host network NAT. These networks will still be routable without NAT."
						/>
						<div>
							{hostNatExcludes}
						</div>
					</label>
					<PageInputButton
						disabled={this.state.disabled}
						hidden={!node.host_block || !node.host_nat}
						buttonClass="bp3-intent-success bp3-icon-add"
						label="Add"
						type="text"
						placeholder="Add exclude"
						value={this.state.addHostNatExclude}
						onChange={(val): void => {
							this.setState({
								...this.state,
								addHostNatExclude: val,
							});
						}}
						onSubmit={this.onAddHostNatExclude}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						hidden={!node.host_block}
						label="Oracle Cloud host routing"
						help="Automatically update Oracle Cloud routing tables with host network."
						checked={node.oracle_host_route}
						onToggle={(): void => {
							this.set('oracle_host_route', !node.oracle_host_route);
						}}
					/>
					<PageInput
						disabled={this.state.disabled}
						hidden={!node.oracle_host_route}
						label="Oracle Cloud User OCID"
						help="User OCID for Oracle Cloud API authentication."
						type="text"
						placeholder="Enter user OCID"
						value={node.oracle_user}
						onChange={(val): void => {
							this.set('oracle_user', val);
						}}
					/>
					<PageTextArea
						disabled={this.state.disabled}
						hidden={!node.oracle_host_route}
						label="Oracle Cloud Public Key"
						help="Public key for Oracle Cloud API authentication."
						placeholder="Oracle Cloud public key"
						readOnly={true}
						rows={6}
						value={node.oracle_public_key}
						onChange={(val: string): void => {
							this.set('oracle_public_key', val);
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="Jumbo frames"
						help="Enable jumbo frames on all interfaces, requires node restart when changed."
						checked={node.jumbo_frames}
						onToggle={(): void => {
							this.set('jumbo_frames', !node.jumbo_frames);
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="Instance iSCSI support"
						help="Enable iSCSI disk support for instances."
						checked={node.iscsi}
						onToggle={(): void => {
							this.set('iscsi', !node.iscsi);
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="PCI Passthough"
						help="Enable PCI passthrough support for instances."
						checked={node.pci_passthrough}
						onToggle={(): void => {
							this.set('pci_passthrough', !node.pci_passthrough);
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="USB Passthough"
						help="Enable USB passthrough support for instances."
						checked={node.usb_passthrough}
						onToggle={(): void => {
							this.set('usb_passthrough', !node.usb_passthrough);
						}}
					/>
					<PageSwitch
						disabled={this.state.disabled}
						label="Firewall"
						help="Configure firewall on node. Incorrectly configuring the firewall can block access to the node."
						checked={node.firewall}
						onToggle={(): void => {
							this.toggleFirewall();
						}}
					/>
				</div>
				<div style={css.group}>
					<PageInfo
						fields={[
							{
								label: 'ID',
								value: this.props.node.id || 'None',
							},
							{
								label: 'Version',
								value: node.software_version || 'Unknown',
							},
							{
								valueClass: active ? '' : 'bp3-text-intent-danger',
								label: 'Timestamp',
								value: MiscUtils.formatDate(
									this.props.node.timestamp) || 'Inactive',
							},
							{
								label: 'CPU Units',
								value: (this.props.node.cpu_units ||
									'Unknown').toString(),
							},
							{
								label: 'CPU Units Reserved',
								value: (this.props.node.cpu_units_res ||
									'Unknown').toString(),
							},
							{
								label: 'Memory Units',
								value: (this.props.node.memory_units ||
									'Unknown').toString(),
							},
							{
								label: 'Memory Units Reserved',
								value: (this.props.node.memory_units_res ||
									'Unknown').toString(),
							},
							{
								label: 'Default Interface',
								value: this.props.node.default_interface || 'Unknown',
							},
							{
								label: 'Hostname',
								value: node.hostname || 'Unknown',
							},
							{
								label: 'Public IPv4',
								value: publicIps,
								copy: true,
							},
							{
								label: 'Public IPv6',
								value: publicIps6,
								copy: true,
							},
							{
								label: 'Requests',
								value: this.props.node.requests_min + '/min',
							},
						]}
						bars={[
							{
								progressClass: 'bp3-no-stripes bp3-intent-success',
								label: 'Load1',
								value: this.props.node.load1,
							},
							{
								progressClass: 'bp3-no-stripes bp3-intent-warning',
								label: 'Load5',
								value: this.props.node.load5,
							},
							{
								progressClass: 'bp3-no-stripes bp3-intent-danger',
								label: 'Load15',
								value: this.props.node.load15,
							},
							{
								progressClass: 'bp3-no-stripes bp3-intent-primary',
								label: 'Memory',
								value: this.props.node.memory,
							},
						]}
					/>
					<PageSelect
						hidden={types.indexOf('hypervisor') === -1}
						disabled={this.state.disabled}
						label="Hypervisor Mode"
						help="Hypervisor mode, select KVM if CPU has hardware virtualization support."
						value={node.hypervisor}
						onChange={(val): void => {
							this.set('hypervisor', val);
						}}
					>
						<option value="qemu">QEMU</option>
						<option value="kvm">KVM</option>
					</PageSelect>
					<PageSelect
						hidden={types.indexOf('hypervisor') === -1}
						disabled={this.state.disabled}
						label="Hypervisor VGA Type"
						help="Type of VGA card to emulate. Virtio provides the best performance. VMware provides better performance then standard. Virtio is required for UEFI guests."
						value={node.vga}
						onChange={(val): void => {
							this.set('vga', val);
						}}
					>
						<option value="virtio">Virtio</option>
						<option value="vmware">VMware</option>
						<option value="std">Standard</option>
					</PageSelect>
					<label
						className="bp3-label"
						style={css.label}
					>
						Instance Passthrough Disks
						<Help
							title="Instance Direct Disks"
							content="Disk devices available to instances for passthrough."
						/>
						<div>
							{availableDrives}
						</div>
					</label>
					<PageSelectButton
						label="Add Disk"
						value={this.state.addDrive}
						disabled={!availableDrivesSelect.length || this.state.disabled}
						buttonClass="bp3-intent-success"
						onChange={(val: string): void => {
							this.setState({
								...this.state,
								addDrive: val,
							});
						}}
						onSubmit={this.onAddDrive}
					>
						{availableDrivesSelect}
					</PageSelectButton>
					<label className="bp3-label">
						Network Roles
						<Help
							title="Network Roles"
							content="Network roles that will be matched with firewall rules. Network roles are case-sensitive. Only firewall roles without an organization will match."
						/>
						<div>
							{networkRoles}
						</div>
					</label>
					<PageInputButton
						disabled={this.state.disabled}
						buttonClass="bp3-intent-success bp3-icon-add"
						label="Add"
						type="text"
						placeholder="Add role"
						value={this.state.addNetworkRole}
						onChange={(val): void => {
							this.setState({
								...this.state,
								addNetworkRole: val,
							});
						}}
						onSubmit={this.onAddNetworkRole}
					/>
					<label
						className="bp3-label"
						style={css.label}
						hidden={node.protocol === 'http'}
					>
						Certificates
						<Help
							title="Certificates"
							content="The certificates to use for this nodes web server. The certificates must be valid for all the domains that this node provides access to. This includes the management domain and any service domains."
						/>
						<div>
							{certificates}
						</div>
					</label>
					<PageSelectButton
						hidden={node.protocol === 'http'}
						label="Add Certificate"
						value={this.state.addCert}
						disabled={this.state.disabled || !hasCertificates}
						buttonClass="bp3-intent-success"
						onChange={(val: string): void => {
							this.setState({
								...this.state,
								addCert: val,
							});
						}}
						onSubmit={this.onAddCert}
					>
						{certificatesSelect}
					</PageSelectButton>
					<PageInputSwitch
						disabled={this.state.disabled}
						label="Forwarded for header"
						help="Enable when using a load balancer. This header value will be used to get the users IP address. It is important to only enable this when a load balancer is used. If it is enabled without a load balancer users can spoof their IP address by providing a value for the header that will not be overwritten by a load balancer. Additionally the nodes firewall should be configured to only accept requests from the load balancer to prevent requests being sent directly to the node bypassing the load balancer."
						type="text"
						placeholder="Forwarded for header"
						value={node.forwarded_for_header}
						checked={this.state.forwardedChecked}
						defaultValue="X-Forwarded-For"
						onChange={(state: boolean, val: string): void => {
							let nde: NodeTypes.Node;

							if (this.state.changed) {
								nde = {
									...this.state.node,
								};
							} else {
								nde = {
									...this.props.node,
								};
							}

							nde.forwarded_for_header = val;

							this.setState({
								...this.state,
								changed: true,
								forwardedChecked: state,
								node: nde,
							});
						}}
					/>
					<PageInputSwitch
						label="Forwarded proto header"
						help="Enable when using a load balancer. This header value will be used to get the users protocol. This will redirect users to https when the forwarded protocol is http."
						type="text"
						placeholder="Forwarded proto header"
						value={node.forwarded_proto_header}
						checked={this.state.forwardedProtoChecked}
						defaultValue="X-Forwarded-Proto"
						onChange={(state: boolean, val: string): void => {
							let nde: NodeTypes.Node;

							if (this.state.changed) {
								nde = {
									...this.state.node,
								};
							} else {
								nde = {
									...this.props.node,
								};
							}

							nde.forwarded_proto_header = val;

							this.setState({
								...this.state,
								changed: true,
								forwardedProtoChecked: state,
								node: nde,
							});
						}}
					/>
				</div>
			</div>
			<PageSave
				style={css.save}
				hidden={!this.state.node}
				message={this.state.message}
				changed={this.state.changed}
				disabled={this.state.disabled}
				light={true}
				onCancel={(): void => {
					this.setState({
						...this.state,
						changed: false,
						forwardedChecked: false,
						forwardedProtoChecked: false,
						node: null,
					});
				}}
				onSave={this.onSave}
			>
				<ConfirmButton
					label="Restart"
					className="bp3-intent-danger bp3-icon-updated"
					progressClassName="bp3-intent-danger"
					style={css.restart}
					hidden={false}
					disabled={this.state.disabled}
					onConfirm={(): void => {
						this.operation('restart');
					}}
				/>
			</PageSave>
		</td>;
	}
}
