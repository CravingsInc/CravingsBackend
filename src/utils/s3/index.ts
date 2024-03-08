import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import mime from "mime-types";
import { Utils } from "../Utils";

const { endpoint, accessKey, secretKey } = Utils.AppConfig.SpaceKeysConfig;

const s3Client = new S3Client({
  endpoint: `https://${endpoint}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

type uploadType = "service_thumbnail";

export type UploadFileType = {
  name: string;
  mv: (
    path: string,
    callback: (err: any) => void
  ) => void | ((path: string) => Promise<void>);
  mimetype: string;
  buffer: Buffer;
  size: number;
  encoding: string;
  tempFilePath: string;
  truncated: boolean;
  md5: string;
};

export async function uploadImage(
  file: UploadFileType,
  uploadType: uploadType,
  folder?: string
) {
  const key = `${ folder ? folder + '/' : '' }${uploadType}/${uuid()}.${mime.extension(file.mimetype)}`;

  const params = {
    Bucket: Utils.AppConfig.SpaceKeysConfig.imageBucket,
    Key: key,
    Body: file.buffer,
    ACL: "public-read",
  };

  await s3Client.send(new PutObjectCommand( params as any ));

  return `${Utils.AppConfig.SpaceKeysConfig.uploadImageUrl}/${key}`;
}
