import * as SwaggerParser from '@apidevtools/swagger-parser';

export const getData = async (urlOrCode: string) => {
    if (typeof urlOrCode === 'string' && !urlOrCode.startsWith("http")) {
        return await SwaggerParser.default.parse(JSON.parse(urlOrCode));
    }
    
    return await SwaggerParser.default.parse(urlOrCode);
}
