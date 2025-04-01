declare module "formidable" {
  import { IncomingMessage } from "http";

  export interface File {
    filepath: string;
    originalFilename?: string;
    newFilename?: string;
    mimetype?: string;
    size?: number;
    hash?: string;
    lastModifiedDate?: Date;
  }

  export interface Options {
    encoding?: string;
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFileSize?: number;
    maxFieldsSize?: number;
    maxFields?: number;
    hash?: boolean | string;
    multiples?: boolean;
    filename?: (
      name: string,
      ext: string,
      part: any,
      form: IncomingForm
    ) => string;
  }

  export interface Fields {
    [key: string]: string[];
  }

  export interface Files {
    [key: string]: File[];
  }

  export class IncomingForm {
    constructor(options?: Options);
    parse(
      req: IncomingMessage | any,
      callback: (err: Error | null, fields: Fields, files: Files) => void
    ): void;
    on(event: string, listener: Function): this;
  }
}
