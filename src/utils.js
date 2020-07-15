import YAML from 'yaml';
import {extname} from 'path';
const fs = eval("require('fs')"); // This is a temporary fix to make sure this statement is executed at runtime

export function readDataSync(path) {
    // Read the file
    const input = fs.readFileSync(path).toString();
    let data;

    // Get the file's type
    let pType = type(path);
    if (pType === 'json') {
        // Parse the JSON
        data = JSON.parse(input);
    } else {
        let yaml = input;
        let content = undefined;
        if (pType === 'md') {
            // If there are more than 2 lines and the first one is a tripple dash
            let lines = input.split('\n');
            if (lines.length >= 2 && lines[0] === '---') {
                yaml = '';
                content = '';

                let i = 1;
                while (lines[i] !== '---') {
                    yaml += lines[i] + '\n';
                    i++;
                }
                i++;

                while (i < lines.length) {
                    content += lines[i] + '\n';
                    i++;
                }
            }
        }

        data = YAML.parse(yaml);
        data.content = content;
    }

    return data;
}

export function saveDataSync(path, data) {
    let output;

    let pType = type(path);
    if (pType === 'json') {
        output = JSON.stringify(data);
    } else {
        output = '';

        // Add the first triple dash
        let content;
        if (pType === 'md') {
            output += '---\n';
            content = data.content;
            data.content = undefined;
        }

        // Add the YAML to the output
        output += YAML.stringify(data);

        // Add the last triple dash and the markdown content
        if (pType === 'md') {
            output += '---\n';
            output += content;
            data.content = content;
        }
    }

    return fs.writeFileSync(path, output);
}

export const yamlExt = ['.yml', '.yaml'];
export const mdExt = ['.markdown', '.mkdown', '.mkdn', '.mkd', '.md'];
export const jsonExt = ['.json', '.js'];
function type(path) {
    const ext = extname(path).toLowerCase();
    return yamlExt.includes(ext) ? 'yaml' :
          (mdExt.includes(ext) ? 'md' : 'json')
}
