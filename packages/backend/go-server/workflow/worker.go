package workflow

import (
	"context"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
	"log"
	rdb "readflow.ai/goserver/db/rdb"
	"readflow.ai/goserver/service"
)

type Worker struct {
	feedService           *service.FeedService
	rdb                   *rdb.PrismaClient
	fetchFeedCronWorkflow *FetchFeedCronWorkflow
}

func NewWorker(fetchFeedCronWorkflow *FetchFeedCronWorkflow, rdb *rdb.PrismaClient, feedService *service.FeedService) *Worker {
	return &Worker{fetchFeedCronWorkflow: fetchFeedCronWorkflow, rdb: rdb, feedService: feedService}
}

func (ws *Worker) Start() {
	// The client and worker are heavyweight objects that should be created once per process.
	c, err := client.Dial(client.Options{
		HostPort: client.DefaultHostPort,
	})
	if err != nil {
		log.Fatalln("Unable to create client", err)
	}
	defer c.Close()

	w := worker.New(c, "cron", worker.Options{})

	w.RegisterWorkflow(ws.fetchFeedCronWorkflow.FetchFeed)
	w.RegisterActivity(ws.feedService)

	// This workflow ID can be user business logic identifier as well.
	workflowOptions := client.StartWorkflowOptions{
		ID:           "cron_fetch_feed",
		TaskQueue:    "cron",
		CronSchedule: "* * * * *",
	}

	we, err := c.ExecuteWorkflow(context.Background(), workflowOptions, ws.fetchFeedCronWorkflow.FetchFeed)
	if err != nil {
		log.Fatalln("Unable to execute workflow", err)
	}
	log.Println("Started workflow", "WorkflowID", we.GetID(), "RunID", we.GetRunID())

	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start worker", err)
	}
}
