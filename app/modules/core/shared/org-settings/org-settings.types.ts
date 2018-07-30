export enum FileShareControlType {
  BLOCK_BOTH = 'BLOCK_BOTH',
  BLOCK_UPLOAD = 'BLOCK_UPLOAD',
  NONE = 'NONE',
}

export enum WhiteboardFileShareControlType {
  ALLOW = 'ALLOW',
  BLOCK = 'BLOCK',
}

export enum OrgSetting {
  BLOCK_EXTERNAL_COMMUNICATIONS = 'blockExternalCommunications',
  CLIENT_SECURITY_POLICY = 'clientSecurityPolicy',
  WHITEBOARD_FILE_SHARE_CONTROL = 'whiteboardFileShareControl',
}

export interface IOrgSettingsResponse {
  orgSettings: string[];
}

export interface IFileShareControl {
  desktopFileShareControl: FileShareControlType;
  mobileFileShareControl: FileShareControlType;
  webFileShareControl: FileShareControlType;
  botFileShareControl: FileShareControlType;
}

export interface IFileShareControlOptions {
  desktopFileShareControl?: FileShareControlType;
  mobileFileShareControl?: FileShareControlType;
  webFileShareControl?: FileShareControlType;
  botFileShareControl?: FileShareControlType;
}