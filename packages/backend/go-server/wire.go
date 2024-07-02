//go:build wireinject
// +build wireinject

package main

import (
	"github.com/google/wire"
	"github.com/mmcdole/gofeed"
	adb "readflow.ai/goserver/db/adb"
	rdb "readflow.ai/goserver/db/rdb"
	"readflow.ai/goserver/graph"
	"readflow.ai/goserver/service"
	"readflow.ai/goserver/workflow"
)

func newFeedParser() *gofeed.Parser {
	return gofeed.NewParser()
}

func InitializeResolver(adb *adb.PrismaClient, rdb *rdb.PrismaClient) (*App, error) {
	wire.Build(
		graph.NewResolver,
		service.NewFeedService,
		workflow.NewWorker,
		workflow.NewFetchFeedCronWorkflow,
		newFeedParser,
		wire.Struct(new(App), "*"),
	)
	return &App{}, nil
}
