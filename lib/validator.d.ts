import { Readable as ReadableStream } from "stream";

export type ValidateResult = {
    valid: boolean;
    result: string;
    messages: string[];
};

export function validateXML(
    xml: string | Buffer| ReadableStream | { file: string },
    pathToXsd: string,
    options?: {
        insecure?: boolean
    }
): Promise<ValidateResult>;

/**
 * @internal
 */
export function setup(): Promise<void>;