import { getData } from './src/swaggerDataProvider';
import { transform } from './src/swaggerToTestTransformer';
import { generate } from './src/gherkinGenerator';
import { readFile, writeFile } from 'node:fs/promises';

export const generateFromSwagger = async (
  urlOrData: string
) => {
  console.time('generateFromSwagger')
  const data = await getData(urlOrData);

  const testsData = transform({
    apiDefinition: data
  });

  const { files } = generate(testsData)

  Promise.all(
    files.map(file => writeFile(file.filename, file.contents, 'utf8'))
  )

  console.timeEnd('generateFromSwagger');
};

readFile('./petstore-swagger.json', 'utf8')
  .then(file => generateFromSwagger(JSON.parse(file)))

