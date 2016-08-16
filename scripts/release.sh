#!/usr/bin/env bash

#clone latest branch
git clone "https://$RELEASE_USER:$RELEASE_TOKEN@github.com/ringcentral/ringcentral-js-integration-commons.git" -b latest release
npm run release

cd release
GIT_STATUS=$(git status -s)
EMPTY_STATUS=' '

if [ "$GIT_STATUS" -ne "$EMPTY_STATUS" ]
  then
  git config user.email "integrations@ringcentral.com"
  git config user.name "RingCentral Integrations Team"
  git add .
  git commit -m "released at $(date)"
  git push origin latest
fi
