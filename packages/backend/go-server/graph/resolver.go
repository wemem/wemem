//go:generate go run github.com/99designs/gqlgen generate

package graph

import (
	adb "readflow.ai/goserver/db/adb"
	rdb "readflow.ai/goserver/db/rdb"
	"readflow.ai/goserver/service"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	adb         *adb.PrismaClient
	rdb         *rdb.PrismaClient
	feedService *service.FeedService
}

func NewResolver(adb *adb.PrismaClient, rdb *rdb.PrismaClient, feedService *service.FeedService) *Resolver {
	return &Resolver{
		adb:         adb,
		rdb:         rdb,
		feedService: feedService,
	}
}
