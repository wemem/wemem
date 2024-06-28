wire:
	go run github.com/google/wire/cmd/wire

gengql:
	go run github.com/99designs/gqlgen generate

genadb:
	go run github.com/steebchen/prisma-client-go generate --schema=./db/affine.prisma

genrdb:
	go run github.com/steebchen/prisma-client-go generate --schema=./db/readflow.prisma

migraterdb:
	go run github.com/steebchen/prisma-client-go migrate dev --schema=./db/readflow.prisma
