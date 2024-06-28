#!/bin/zsh
cp -r ../server/schema.prisma ./db/affine.prisma
sed -i '' 's/prisma-client-js/go run github.com\/steebchen\/prisma-client-go/g' ./db/affine.prisma
sed -i '' '/previewFeatures = \[/a\
  output          = ".\/db\/adb"
' ./db/affine.prisma
