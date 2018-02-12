package instance

import (
	"github.com/dropbox/godropbox/container/set"
	"github.com/dropbox/godropbox/errors"
	"github.com/pritunl/pritunl-cloud/database"
	"github.com/pritunl/pritunl-cloud/errortypes"
	"gopkg.in/mgo.v2/bson"
)

type Instance struct {
	Id           bson.ObjectId `bson:"_id,omitempty" json:"id"`
	Organization bson.ObjectId `bson:"organization,omitempty" json:"organization"`
	Zone         bson.ObjectId `bson:"zone,omitempty" json:"zone"`
	Name         string        `bson:"name" json:"name"`
}

func (i *Instance) Validate(db *database.Database) (
	errData *errortypes.ErrorData, err error) {

	return
}

func (i *Instance) Commit(db *database.Database) (err error) {
	coll := db.Instances()

	err = coll.Commit(i.Id, i)
	if err != nil {
		return
	}

	return
}

func (i *Instance) CommitFields(db *database.Database, fields set.Set) (
	err error) {

	coll := db.Instances()

	err = coll.CommitFields(i.Id, i, fields)
	if err != nil {
		return
	}

	return
}

func (i *Instance) Insert(db *database.Database) (err error) {
	coll := db.Instances()

	if i.Id != "" {
		err = &errortypes.DatabaseError{
			errors.New("datecenter: Instance already exists"),
		}
		return
	}

	err = coll.Insert(i)
	if err != nil {
		err = database.ParseError(err)
		return
	}

	return
}
