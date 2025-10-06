#!/bin/bash

# Script to create a new NQL project based on nio-nql-workbench
# This script removes the existing git repository and creates a new one

# Display usage information
echo "===== NIO NQL Workbench Project Setup ====="
echo "This script will create a new NQL workbench project"
echo "by removing the existing git repository and creating a new one."

# Prompt for project name
read -p "Enter project name: " project_name

# Validate input
if [ -z "$project_name" ]; then
	echo "Error: Project name cannot be empty"
	exit 1
fi

# Confirm with user
echo "This will create a new git repository named '$project_name' in the current directory."
echo "The existing .git directory will be removed."
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
	echo "Operation cancelled."
	exit 0
fi

# Remove existing git repository
echo "Removing existing git repository..."
rm -rf .git

# Initialize new git repository
echo "Initializing new git repository..."
git init

# Create initial commit
echo "Creating initial commit..."
git add .
git commit -m "Initial commit for $project_name NQL workbench"

# Update project information
echo "Updating project information..."
sed -i.bak "s/nio-nql-workbench/$project_name/g" package.json
rm -f package.json.bak

# Add a simple note to README about the project
echo "" >>README.md
echo "## Project: $project_name" >>README.md
echo "This is a project instance of the NQL workbench." >>README.md

echo "Done! Your NQL workbench project '$project_name' is ready."
echo "You can now add your project-specific configurations and queries."
