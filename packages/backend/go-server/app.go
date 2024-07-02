package main

import (
	"readflow.ai/goserver/graph"
	"readflow.ai/goserver/workflow"
)

type App struct {
	Resolver *graph.Resolver
	Worker   *workflow.Worker
}
