import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { DocumentState, type LangiumDocument } from 'langium';
import {
    createDb2AiDslServices,
    isModel,
    loadLocalEnvFiles,
    validateSqlBlocksWithExamples,
    workspaceDirsForDocumentUri
} from 'db-2-ai-dsl-language';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import type { Diagnostic } from 'vscode-languageserver';
import { URI } from 'langium';

const connection = createConnection(ProposedFeatures.all);

const { shared } = createDb2AiDslServices({ connection, ...NodeFileSystem });

const SQL_DB_DEBOUNCE_MS = 2000;
const sqlDbDiagnosticsByUri = new Map<string, Diagnostic[]>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function normalizeDocumentUri(documentUri: string): string {
    return URI.parse(documentUri).toString();
}

function mergeDiagnostics(langiumDiags: Diagnostic[], sqlDbDiags: Diagnostic[]): Diagnostic[] {
    const withoutPriorSql = langiumDiags.filter((d) => d.source !== 'db2ai-sql');
    return [...withoutPriorSql, ...sqlDbDiags];
}

function publishMergedDiagnostics(document: LangiumDocument): void {
    const documentUri = normalizeDocumentUri(document.uri.toString());
    const sqlDbDiags = sqlDbDiagnosticsByUri.get(documentUri) ?? [];
    const merged = mergeDiagnostics(document.diagnostics ?? [], sqlDbDiags);
    connection.sendDiagnostics({ uri: documentUri, diagnostics: merged });
}

async function refreshSqlDbDiagnostics(documentUri: string): Promise<void> {
    await shared.workspace.WorkspaceManager.ready;

    const uri = URI.parse(documentUri);
    const document = await shared.workspace.LangiumDocuments.getOrCreateDocument(uri);
    if (document.state < DocumentState.Validated) {
        await shared.workspace.DocumentBuilder.build([document], { validation: true });
    }

    loadLocalEnvFiles(workspaceDirsForDocumentUri(documentUri));
    const model = document.parseResult.value;
    const sqlDbDiags =
        model !== undefined && isModel(model) ? await validateSqlBlocksWithExamples(model, documentUri) : [];

    sqlDbDiagnosticsByUri.set(documentUri, sqlDbDiags);
    publishMergedDiagnostics(document);
}

function logSqlValidationError(err: unknown): void {
    console.error('[db2ai-sql] validation failed:', err);
}

function cancelScheduledSqlValidation(documentUri: string): void {
    const existing = debounceTimers.get(documentUri);
    if (existing) {
        clearTimeout(existing);
        debounceTimers.delete(documentUri);
    }
}

/** Debounced on edit; immediate on open/save. */
function requestSqlDbValidation(documentUri: string, immediate: boolean): void {
    const normalizedUri = normalizeDocumentUri(documentUri);
    cancelScheduledSqlValidation(normalizedUri);

    if (immediate) {
        void refreshSqlDbDiagnostics(normalizedUri).catch(logSqlValidationError);
        return;
    }

    debounceTimers.set(
        normalizedUri,
        setTimeout(() => {
            debounceTimers.delete(normalizedUri);
            void refreshSqlDbDiagnostics(normalizedUri).catch(logSqlValidationError);
        }, SQL_DB_DEBOUNCE_MS)
    );
}

// Re-merge cached SQL diagnostics after Langium publishes (register before startLanguageServer).
shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Validated, (document) => {
    publishMergedDiagnostics(document);
});

startLanguageServer(shared);

const textDocuments = shared.workspace.TextDocuments;

textDocuments.onDidOpen((event) => {
    requestSqlDbValidation(event.document.uri, true);
});

textDocuments.onDidChangeContent((event) => {
    requestSqlDbValidation(event.document.uri, false);
});

textDocuments.onDidSave((event) => {
    requestSqlDbValidation(event.document.uri, true);
});

textDocuments.onDidClose((event) => {
    const normalizedUri = normalizeDocumentUri(event.document.uri);
    sqlDbDiagnosticsByUri.delete(normalizedUri);
    cancelScheduledSqlValidation(normalizedUri);
});
