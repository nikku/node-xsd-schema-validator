export function validateXML(
    xml: string | ReadableStream | { file: string },
    pathToXsd: string
): Promise<{
    valid: boolean;
    result: string;
    messages: string[];
}>;