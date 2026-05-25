import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { loadLocalEnvFiles, workspaceDirsForDocumentUri } from 'db-2-ai-dsl-language';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createDb2AiDslServices } from 'db-2-ai-dsl-language';

const connection = createConnection(ProposedFeatures.all);

const { shared } = createDb2AiDslServices({ connection, ...NodeFileSystem });

function loadEnvForDocumentUri(documentUri: string): void {
    loadLocalEnvFiles(workspaceDirsForDocumentUri(documentUri));
}

connection.onDidOpenTextDocument((params) => {
    loadEnvForDocumentUri(params.textDocument.uri);
});

connection.onDidChangeTextDocument((params) => {
    loadEnvForDocumentUri(params.textDocument.uri);
});

startLanguageServer(shared);
