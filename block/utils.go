package block

import (
	"github.com/pritunl/mongo-go-driver/bson"
	"github.com/pritunl/mongo-go-driver/bson/primitive"
	"github.com/pritunl/pritunl-cloud/database"
)

func Get(db *database.Database, blockId primitive.ObjectID) (
	block *Block, err error) {

	coll := db.Blocks()
	block = &Block{}

	err = coll.FindOneId(blockId, block)
	if err != nil {
		return
	}

	return
}

func GetAll(db *database.Database) (blocks []*Block, err error) {
	coll := db.Blocks()
	blocks = []*Block{}

	cursor, err := coll.Find(db, bson.M{})
	if err != nil {
		err = database.ParseError(err)
		return
	}
	defer cursor.Close(db)

	for cursor.Next(db) {
		blck := &Block{}
		err = cursor.Decode(blck)
		if err != nil {
			err = database.ParseError(err)
			return
		}

		blocks = append(blocks, blck)
	}

	err = cursor.Err()
	if err != nil {
		err = database.ParseError(err)
		return
	}

	return
}

func GetInstanceIp(db *database.Database,
	instId primitive.ObjectID) (blck *Block, blckIp *BlockIp, err error) {

	coll := db.BlocksIp()
	blckIp = &BlockIp{}

	err = coll.FindOne(db, &bson.M{
		"instance": instId,
	}).Decode(blckIp)
	if err != nil {
		err = database.ParseError(err)
		blckIp = nil
		if _, ok := err.(*database.NotFoundError); ok {
			err = nil
		}
		return
	}

	blck, err = Get(db, blckIp.Block)
	if err != nil {
		if _, ok := err.(*database.NotFoundError); ok {
			RemoveIp(db, blckIp.Id)
		}
		blckIp = nil
		return
	}

	return
}

func Remove(db *database.Database, blockId primitive.ObjectID) (err error) {
	coll := db.Blocks()

	_, err = coll.DeleteOne(db, &bson.M{
		"_id": blockId,
	})
	if err != nil {
		err = database.ParseError(err)
		switch err.(type) {
		case *database.NotFoundError:
			err = nil
		default:
			return
		}
	}

	return
}
