package workflow

import (
	"go.temporal.io/sdk/workflow"
	rdb "readflow.ai/goserver/db/rdb"
	"readflow.ai/goserver/service"
	"time"
)

// CronResult is used to return data from one cron run to the next
type CronResult struct {
	RunTime time.Time
}

type FetchFeedCronWorkflow struct {
	rdb         *rdb.PrismaClient
	feedService *service.FeedService
}

func NewFetchFeedCronWorkflow(rdb *rdb.PrismaClient, feedService *service.FeedService) *FetchFeedCronWorkflow {
	return &FetchFeedCronWorkflow{rdb: rdb, feedService: feedService}
}

// FetchFeedCronWorkflow executes on the given schedule
// The schedule is provided when starting the Workflow
func (w *FetchFeedCronWorkflow) FetchFeed(ctx workflow.Context) (*CronResult, error) {

	workflow.GetLogger(ctx).Info("定时启动拉取 Feed 工作流.", "StartTime", workflow.Now(ctx))

	ao := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	}
	ctx1 := workflow.WithActivityOptions(ctx, ao)

	thisRunTime := workflow.Now(ctx)
	err := workflow.ExecuteActivity(ctx1, w.feedService.RefreshFeed, "fc39b65a-33da-11ef-bf09-b217f1d645c9").Get(ctx, nil)
	if err != nil {
		// Cron job failed
		// Next cron will still be scheduled by the Server
		workflow.GetLogger(ctx).Error("Cron job failed.", "Error", err)
		return nil, err
	}

	return &CronResult{RunTime: thisRunTime}, nil
}
