package uhandlers

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/dropbox/godropbox/container/set"
	"github.com/dropbox/godropbox/errors"
	"github.com/gin-gonic/gin"
	"github.com/pritunl/mongo-go-driver/bson"
	"github.com/pritunl/mongo-go-driver/bson/primitive"
	"github.com/pritunl/pritunl-cloud/aggregate"
	"github.com/pritunl/pritunl-cloud/data"
	"github.com/pritunl/pritunl-cloud/database"
	"github.com/pritunl/pritunl-cloud/datacenter"
	"github.com/pritunl/pritunl-cloud/demo"
	"github.com/pritunl/pritunl-cloud/disk"
	"github.com/pritunl/pritunl-cloud/errortypes"
	"github.com/pritunl/pritunl-cloud/event"
	"github.com/pritunl/pritunl-cloud/image"
	"github.com/pritunl/pritunl-cloud/instance"
	"github.com/pritunl/pritunl-cloud/node"
	"github.com/pritunl/pritunl-cloud/storage"
	"github.com/pritunl/pritunl-cloud/utils"
	"github.com/pritunl/pritunl-cloud/zone"
)

type diskData struct {
	Id               primitive.ObjectID `json:"id"`
	Name             string             `json:"name"`
	Comment          string             `json:"comment"`
	Instance         primitive.ObjectID `json:"instance"`
	Index            string             `json:"index"`
	Node             primitive.ObjectID `json:"node"`
	DeleteProtection bool               `json:"delete_protection"`
	Image            primitive.ObjectID `json:"image"`
	RestoreImage     primitive.ObjectID `json:"restore_image"`
	Backing          bool               `json:"backing"`
	State            string             `json:"state"`
	Size             int                `json:"size"`
	NewSize          int                `json:"new_size"`
	Backup           bool               `json:"backup"`
}

type disksMultiData struct {
	Ids   []primitive.ObjectID `json:"ids"`
	State string               `json:"state"`
}

type disksData struct {
	Disks []*aggregate.DiskAggregate `json:"disks"`
	Count int64                      `json:"count"`
}

func diskPut(c *gin.Context) {
	if demo.Blocked(c) {
		return
	}

	db := c.MustGet("db").(*database.Database)
	userOrg := c.MustGet("organization").(primitive.ObjectID)
	dta := &diskData{}

	diskId, ok := utils.ParseObjectId(c.Param("disk_id"))
	if !ok {
		utils.AbortWithStatus(c, 400)
		return
	}

	err := c.Bind(dta)
	if err != nil {
		err = &errortypes.ParseError{
			errors.Wrap(err, "handler: Bind error"),
		}
		utils.AbortWithError(c, 500, err)
		return
	}

	dsk, err := disk.GetOrg(db, userOrg, diskId)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	fields := set.NewSet(
		"name",
		"comment",
		"instance",
		"delete_protection",
		"index",
		"backup",
		"new_size",
	)

	if !dta.Instance.IsZero() {
		exists, err := instance.ExistsOrg(db, userOrg, dta.Instance)
		if err != nil {
			return
		}
		if !exists {
			utils.AbortWithStatus(c, 405)
			return
		}
	}

	dsk.PreCommit()

	dsk.Name = dta.Name
	dsk.Comment = dta.Comment
	dsk.Instance = dta.Instance
	dsk.DeleteProtection = dta.DeleteProtection
	dsk.Index = dta.Index
	dsk.Backup = dta.Backup

	if dsk.State == disk.Available && dta.State == disk.Snapshot {
		dsk.State = disk.Snapshot
		fields.Add("state")
	} else if dsk.State == disk.Available && dta.State == disk.Backup {
		dsk.State = disk.Backup
		fields.Add("state")
	} else if dsk.State == disk.Available && dta.State == disk.Expand {
		dsk.State = disk.Expand
		dsk.NewSize = dta.NewSize
		fields.Add("state")
	} else if dta.State == disk.Restore {
		if dsk.State == disk.Available {
			errData := &errortypes.ErrorData{
				Error:   "disk_restore_active",
				Message: "Disk restore already active",
			}

			c.JSON(400, errData)
			return
		}

		img, err := image.Get(db, dta.RestoreImage)
		if err != nil {
			utils.AbortWithError(c, 500, err)
			return
		}

		if img.Disk != dsk.Id {
			errData := &errortypes.ErrorData{
				Error:   "invalid_restore_image",
				Message: "Invalid restore image",
			}

			c.JSON(400, errData)
			return
		}

		dsk.State = disk.Restore
		dsk.RestoreImage = img.Id

		fields.Add("state")
		fields.Add("restore_image")
	}

	errData, err := dsk.Validate(db)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	if errData != nil {
		c.JSON(400, errData)
		return
	}

	err = dsk.CommitFields(db, fields)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	event.PublishDispatch(db, "disk.change")

	c.JSON(200, dsk)
}

func diskPost(c *gin.Context) {
	if demo.Blocked(c) {
		return
	}

	db := c.MustGet("db").(*database.Database)
	userOrg := c.MustGet("organization").(primitive.ObjectID)
	dta := &diskData{
		Name: "New Disk",
	}

	err := c.Bind(dta)
	if err != nil {
		err = &errortypes.ParseError{
			errors.Wrap(err, "handler: Bind error"),
		}
		utils.AbortWithError(c, 500, err)
		return
	}

	if !dta.Instance.IsZero() {
		exists, err := instance.ExistsOrg(db, userOrg, dta.Instance)
		if err != nil {
			return
		}
		if !exists {
			utils.AbortWithStatus(c, 405)
			return
		}
	}

	nde, err := node.Get(db, dta.Node)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	zne, err := zone.Get(db, nde.Zone)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	exists, err := datacenter.ExistsOrg(db, userOrg, zne.Datacenter)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}
	if !exists {
		utils.AbortWithStatus(c, 405)
		return
	}

	if !dta.Image.IsZero() {
		img, err := image.GetOrgPublic(db, userOrg, dta.Image)
		if err != nil {
			utils.AbortWithError(c, 500, err)
			return
		}

		store, err := storage.Get(db, img.Storage)
		if err != nil {
			return
		}

		available, err := data.ImageAvailable(store, img)
		if err != nil {
			utils.AbortWithError(c, 500, err)
			return
		}
		if !available {
			if store.IsOracle() {
				errData := &errortypes.ErrorData{
					Error:   "image_not_available",
					Message: "Image not restored from archive",
				}
				c.JSON(400, errData)
			} else {
				errData := &errortypes.ErrorData{
					Error:   "image_not_available",
					Message: "Image not restored from glacier",
				}
				c.JSON(400, errData)
			}

			return
		}
	}

	dsk := &disk.Disk{
		Name:             dta.Name,
		Comment:          dta.Comment,
		Organization:     userOrg,
		Instance:         dta.Instance,
		Index:            dta.Index,
		Node:             dta.Node,
		Image:            dta.Image,
		DeleteProtection: dta.DeleteProtection,
		Backing:          dta.Backing,
		Size:             dta.Size,
		Backup:           dta.Backup,
	}

	errData, err := dsk.Validate(db)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	if errData != nil {
		c.JSON(400, errData)
		return
	}

	err = dsk.Insert(db)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	event.PublishDispatch(db, "disk.change")

	c.JSON(200, dsk)
}

func disksPut(c *gin.Context) {
	if demo.Blocked(c) {
		return
	}

	db := c.MustGet("db").(*database.Database)
	userOrg := c.MustGet("organization").(primitive.ObjectID)
	data := &disksMultiData{}

	err := c.Bind(data)
	if err != nil {
		err = &errortypes.ParseError{
			errors.Wrap(err, "handler: Bind error"),
		}
		utils.AbortWithError(c, 500, err)
		return
	}

	if data.State != disk.Snapshot && data.State != disk.Backup {
		errData := &errortypes.ErrorData{
			Error:   "invalid_state",
			Message: "Invalid disk state",
		}

		c.JSON(400, errData)
		return
	}

	doc := bson.M{
		"state": data.State,
	}

	err = disk.UpdateMultiOrg(db, userOrg, data.Ids, &doc)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	event.PublishDispatch(db, "disk.change")

	c.JSON(200, nil)
}

func diskDelete(c *gin.Context) {
	if demo.Blocked(c) {
		return
	}

	db := c.MustGet("db").(*database.Database)
	userOrg := c.MustGet("organization").(primitive.ObjectID)

	diskId, ok := utils.ParseObjectId(c.Param("disk_id"))
	if !ok {
		utils.AbortWithStatus(c, 400)
		return
	}

	dsk, err := disk.Get(db, diskId)
	if err != nil {
		return
	}

	if dsk.DeleteProtection {
		errData := &errortypes.ErrorData{
			Error:   "delete_protection",
			Message: "Cannot delete disk with delete protection",
		}

		c.JSON(400, errData)
		return
	}

	err = disk.DeleteOrg(db, userOrg, diskId)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	event.PublishDispatch(db, "disk.change")

	c.JSON(200, nil)
}

func disksDelete(c *gin.Context) {
	if demo.Blocked(c) {
		return
	}

	db := c.MustGet("db").(*database.Database)
	userOrg := c.MustGet("organization").(primitive.ObjectID)
	dta := []primitive.ObjectID{}

	err := c.Bind(&dta)
	if err != nil {
		err = &errortypes.ParseError{
			errors.Wrap(err, "handler: Bind error"),
		}
		utils.AbortWithError(c, 500, err)
		return
	}

	err = disk.DeleteMultiOrg(db, userOrg, dta)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	event.PublishDispatch(db, "disk.change")

	c.JSON(200, nil)
}

func diskGet(c *gin.Context) {
	db := c.MustGet("db").(*database.Database)
	userOrg := c.MustGet("organization").(primitive.ObjectID)

	diskId, ok := utils.ParseObjectId(c.Param("disk_id"))
	if !ok {
		utils.AbortWithStatus(c, 400)
		return
	}

	dsk, err := disk.GetOrg(db, userOrg, diskId)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	c.JSON(200, dsk)
}

func disksGet(c *gin.Context) {
	db := c.MustGet("db").(*database.Database)
	userOrg := c.MustGet("organization").(primitive.ObjectID)

	page, _ := strconv.ParseInt(c.Query("page"), 10, 0)
	pageCount, _ := strconv.ParseInt(c.Query("page_count"), 10, 0)

	query := bson.M{
		"organization": userOrg,
	}

	diskId, ok := utils.ParseObjectId(c.Query("id"))
	if ok {
		query["_id"] = diskId
	}

	name := strings.TrimSpace(c.Query("name"))
	if name != "" {
		query["name"] = &bson.M{
			"$regex":   fmt.Sprintf(".*%s.*", name),
			"$options": "i",
		}
	}

	inst, ok := utils.ParseObjectId(c.Query("instance"))
	if ok {
		query["instance"] = inst
	}

	disks, count, err := aggregate.GetDiskPaged(db, &query, page, pageCount)
	if err != nil {
		utils.AbortWithError(c, 500, err)
		return
	}

	dta := &disksData{
		Disks: disks,
		Count: count,
	}

	c.JSON(200, dta)
}
