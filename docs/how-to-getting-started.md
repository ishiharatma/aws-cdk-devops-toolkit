# Getting Started

## Add workspaces

- linux

```sh
workspaces_name=sample
npm init -w workspaces\${workspaces_name}
cd workspaces\${workspaces_name}
rm package.json
cdk init app --language typescript
cd ../../
cp ./workspaces_template/tsconfig_template.json ./workspaces/${workspaces_name}/tsconfig.json
cp ./workspaces_template/README_template.md ./workspaces/${workspaces_name}/README.md
npm install -w workspaces\${workspaces_name} --save aws-cdk-lib constructs
npm install -w workspaces\${workspaces_name} --save-dev @types/js-yaml
```

- Windows

```bat
SET workspaces_name=sample
npm init -w workspaces\%workspaces_name% -y
cd workspaces\%workspaces_name%
del package.json
cdk init app --language typescript
cd ../../
copy /y .\workspaces_template\tsconfig_template.json .\workspaces\%workspaces_name%\tsconfig.json
copy /y .\workspaces_template\README_template.md .\workspaces\%workspaces_name%\README.md
npm install -w workspaces\%workspaces_name% --save aws-cdk-lib constructs
npm install -w workspaces\%workspaces_name% --save-dev @types/js-yaml
```

```PowerShell
$workspaces_name="sample"
npm init -w "workspaces\$workspaces_name"
Set-Location "workspaces\$workspaces_name"
Remove-Item package.json -Force
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
cdk init app --language typescript
Set-Location ..\..\
Copy-Item .\workspaces_template\tsconfig_template.json .\workspaces\$workspaces_name\tsconfig.json -Force
Copy-Item .\workspaces_template\README_template.md .\workspaces\$workspaces_name\README.md -Force
npm install -w workspaces\$workspaces_name --save aws-cdk-lib constructs
npm install -w workspaces\$workspaces_name --save-dev @types/js-yaml
```
