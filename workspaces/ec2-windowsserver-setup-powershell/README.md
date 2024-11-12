# AWS EC2 Windows Server Initial Setup with PowerShell

[日本語](README.ja.md) | English

This repository contains a PowerShell script designed for setting up a Windows Server instance on AWS EC2. The script performs various initial configurations such as creating directories, setting display options, adding context menu options, downloading and installing language packs, setting the system locale, and installing essential software like AWS CLI v2 and Google Chrome.

## Script Overview

### Key Features

- Create installer directory if it doesn't exist.
- Set hidden file and file extension visibility.
- Add Command Prompt and PowerShell options to the context menu.
- Download and install the Japanese language pack.
- Set the system locale, UI language, and timezone to Japan.
- Install AWS CLI v2 and Google Chrome.
- Download files from S3.

### Usage

1. **Prepare the User Data**:
   - Copy the content of the `userdata.txt` file.
   - Paste it into the User Data section when launching a new EC2 instance.

2. **Adjust File Paths**:
   - Modify the S3 file paths in the `download-S3` function to match your bucket and file structure.

### Running the Script

When you launch a new Windows Server instance on AWS EC2, paste the script into the User Data field. The script will execute automatically upon the first boot of the instance, setting up the environment as specified.

## Contributing

If you have any suggestions or improvements, please create a pull request or open an issue.

## License

This project is released under the Apache License 2.0. See the [LICENSE](../../LICENSE) file for details.
