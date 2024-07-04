import { generate as generateGivenStatement } from './gherkinGivenGenerator';

export const NAME = "Gherkin";
const generatorLang = "gherkin";

function generateScenarios(testSuites) {
    const lines: string[] = [];
  
    for (const testSuite of testSuites) {
      for (const test of testSuite.tests) {
        lines.push(`\tScenario: ${test.name}`);
        lines.push(`\t${generateGivenStatement(test)}`);
        lines.push(`\tWhen I submit to "${test.path}" using "${test.method}"`);
        lines.push(`\tThen I should receive "${test.code}" status code`);
        lines.push('\t\r\n');
      };
    };
    return lines;

};

export const generate = (request) => {
    const testSuites = request.testSuites;
    const name = request.name;
    const scenarios = generateScenarios(testSuites);

    const lines = [];
    lines.push("");
    lines.push(`Feature: ${name}`);
    lines.push('\r\n');
    const contents = lines.concat(scenarios).join('\r\n');

    return  {
        name: NAME,
        files: [
            {
                name: "Feature file contents",
                filename: `${name}.feature`,
                lang:    generatorLang,
                contents: contents
            }
        ]
    
    };
}
