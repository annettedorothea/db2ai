import { type Module, inject } from 'langium';
import {
    createDefaultModule,
    createDefaultSharedModule,
    type DefaultSharedModuleContext,
    type LangiumServices,
    type LangiumSharedServices,
    type PartialLangiumServices
} from 'langium/lsp';
import { Db2AiDslGeneratedModule, Db2AiDslGeneratedSharedModule } from './generated/module.js';
import { Db2AiDslCompletionProvider } from './db-2-ai-dsl-completion-provider.js';
import { Db2AiDslValidator, registerValidationChecks } from './db-2-ai-dsl-validator.js';

export type Db2AiDslAddedServices = {
    validation: {
        Db2AiDslValidator: Db2AiDslValidator;
    };
};

export type Db2AiDslServices = LangiumServices & Db2AiDslAddedServices;

export const Db2AiDslModule: Module<Db2AiDslServices, PartialLangiumServices & Db2AiDslAddedServices> = {
    validation: {
        Db2AiDslValidator: () => new Db2AiDslValidator()
    },
    lsp: {
        CompletionProvider: (services) => new Db2AiDslCompletionProvider(services)
    }
};

export function createDb2AiDslServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices;
    Db2AiDsl: Db2AiDslServices;
} {
    const shared = inject(createDefaultSharedModule(context), Db2AiDslGeneratedSharedModule);
    const Db2AiDsl = inject(createDefaultModule({ shared }), Db2AiDslGeneratedModule, Db2AiDslModule);
    shared.ServiceRegistry.register(Db2AiDsl);
    registerValidationChecks(Db2AiDsl);
    if (!context.connection) {
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, Db2AiDsl };
}
