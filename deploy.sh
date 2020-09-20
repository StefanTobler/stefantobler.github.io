#!/bin/sh

msg="rebuilding site $(date)"

# Optional argument to supply build message. Use the syntax $ ./deploy.sh 'message'
if [[ $# -ne 0 ]]; then 
	msg="${msg} - ${1}"
fi

# If a command fails then the deploy stops
set -e

printf "\033[0;32mDeploying updates to GitHub...\033[0m\n"

# Build the project.
hugo -t stefan # if using a theme, replace with `hugo -t <YOURTHEME>`

# Go To Public folder
cd public

# Add changes to git.
git add .

git commit -m "$msg"

# Push source and build repos.
git push origin master
