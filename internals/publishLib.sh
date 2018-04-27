#!/bin/bash
set -e

current_version=$(node -p "require('./package').version")

printf "Next version (current is $current_version)? "
read next_version

if ! [[ $next_version =~ ^[0-9]\.[0-9]+\.[0-9](-.+)? ]]; then
  echo "Version must be a valid semver string, e.g. 1.0.2 or 2.3.0-beta.1"
  exit 1
fi

echo "$(node -p "p=require('./package.json');p.version='${next_version}';JSON.stringify(p,null,2)")" > 'package.json'
echo "Updated version to ${next_version}"

rm -rf lib/*
npm run build

read -p "Are you ready to publish? [Y/n] " -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! $REPLY == "" ]]
then
  echo "Exit by user"
  exit 1
fi

git add -A
git commit -m "Bumps up version to $next_version"

next_ref="v$next_version"
git tag "$next_ref"
git tag latest -f

git push origin master
git push origin "$next_ref"
git push origin latest -f

npm publish --registry https://prod-nexus.sprinklr.com/nexus/repository/npm-internal/