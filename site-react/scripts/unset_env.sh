#!/bin/bash

# vscode bug reading old variables

printenv | grep "VITE"
unset VITE_PANGO_API_URL && unset VSCODE_ENV_REPLACE