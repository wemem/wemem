package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	adb "readflow.ai/goserver/db/adb"
	rdb "readflow.ai/goserver/db/rdb"
	"syscall"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gin-gonic/gin"
	"readflow.ai/goserver/graph"
)

const defaultPort = "4010"

// Defining the Graphql handler
func graphqlHandler() gin.HandlerFunc {
	// NewExecutableSchema and Config are in the generated.go file
	// Resolver is in the resolver.go file

	adbClient := adb.NewClient()
	if err := adbClient.Prisma.Connect(); err != nil {
		panic(err)
	}

	rdbClient := rdb.NewClient()
	if err := rdbClient.Prisma.Connect(); err != nil {
		panic(err)
	}

	resolver, err := InitializeResolver(adbClient, rdbClient)
	if err != nil {
		panic(err)
	}

	h := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}

// Defining the Playground handler
func playgroundHandler() gin.HandlerFunc {
	h := playground.Handler("GraphQL playground", "/api/v1/graphql")

	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}

func GinContextToContextMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.WithValue(c.Request.Context(), "GinContextKey", c)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func main() {
	err := os.Setenv("DATABASE_URL", "postgres://affine:affine@localhost:5432/affine?sslmode=disable")
	if err != nil {
		panic(err)
	}
	err = os.Setenv("DATABASE_URL_READFLOW", "postgres://affine:affine@localhost:5432/readflow?sslmode=disable")
	if err != nil {
		panic(err)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	slog.Info("sss")

	// Setting up Gin
	r := gin.Default()
	r.Use(GinContextToContextMiddleware())
	r.POST("/api/v1/graphql", graphqlHandler())
	r.GET("/", playgroundHandler())
	log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r.Handler(),
	}

	go func() {
		// service connections
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal, 1)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall. SIGKILL but can"t be catch, so don't need add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutdown Server ...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server Shutdown:", err)
	}
	// catching ctx.Done(). timeout of 5 seconds.
	select {
	case <-ctx.Done():
		log.Println("timeout of 5 seconds.")
	}
	log.Println("Server exiting")
	if err != nil {
		panic(err)
	}
}
