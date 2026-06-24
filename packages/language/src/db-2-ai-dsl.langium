grammar Db2AiDsl

entry Model:
    'database' dialect=DatabaseDialect ('env' env=STRING)?
    (auth?='auth')?
    (entries += SqlQuery)*;

DatabaseDialect returns string:
    'postgres' | 'postgresql' | 'mysql' | 'mariadb' | 'sqlserver' | 'mssql' | 'oracle';

SqlQuery:
    'SQL' '{'
        ('toolName' ':' toolName=ID)?
        'access' ':' access=AccessKind
        ('authorize' ':' authorize=AuthorizeSpec)?
        ('prepare' ':' prepare=PrepareSpec)?
        ('intent' ':' intent=DslText)?
        ('query' ':' query=DslText)?
        ('summary' ':' summary=DslText)?
        ('params' ':' params=SqlParamMap)?
        ('response' ':' response=DslText)?
    '}';

AccessKind:
    PublicAccess | ProtectedAccess;

PublicAccess:
    {infer PublicAccess} 'public';

ProtectedAccess:
    {infer ProtectedAccess} 'protected';

AuthorizeSpec:
    AuthorizeTrue;

AuthorizeTrue:
    {infer AuthorizeTrue} 'true';

PrepareSpec:
    PrepareTrue | PrepareBody;

PrepareTrue:
    {infer PrepareTrue} 'true';

PrepareBody:
    {infer PrepareBody} '{' ('optionalParams' ':' '[' (optionalParams+=[SqlParamEntry:ID] (',' optionalParams+=[SqlParamEntry:ID])*)? ']')? '}';

SqlParamMap:
    '{' (entries += SqlParamEntry)* '}';

SqlParamEntry:
    key=ID ':' spec=SqlParamSpec;

SqlParamSpec:
    '{' (fields += SqlParamSpecField)* '}';

SqlParamSpecField:
    'description' ':' description=DslText |
    'example' ':' example=DslText |
    'type' ':' paramType=SqlParamType;

SqlParamType returns string:
    'string' | 'integer' | 'number' | 'boolean';

DslText returns string:
    STRING | MULTILINE_STRING;

terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal MULTILINE_STRING: /'''[\s\S]*?'''|"""[\s\S]*?"""/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
