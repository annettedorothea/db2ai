grammar Db2AiDsl

entry Model:
    'database' dialect=DatabaseDialect ('env' env=STRING)?
    (auth=Auth)?
    (entries += SqlQuery)*;

Auth:
    BareAuth | AuthBlock;

BareAuth:
    {infer BareAuth} 'auth';

AuthBlock:
    'auth' '{' ('hooks' ':' hooks=AuthHooks)? '}';

AuthHooks:
    '{' 'verifyCredential' ':' verifyCredential=Boolean '}';

DatabaseDialect returns string:
    'postgres' | 'postgresql' | 'mysql' | 'mariadb' | 'sqlserver' | 'mssql' | 'oracle';

SqlQuery:
    'SQL' '{'
        ('toolName' ':' toolName=ID)?
        'access' ':' access=AccessKind
        ('hooks' ':' hooks=ToolHooks)?
        ('intent' ':' intent=DslText)?
        ('query' ':' query=DslText)?
        ('summary' ':' summary=DslText)?
        ('params' ':' params=SqlParamMap)?
        ('response' ':' response=DslText)?
    '}';

ToolHooks:
    '{'
        ('checkToolAccess' ':' checkToolAccess=Boolean)?
        ('prepareToolCall' ':' prepareToolCall=PrepareToolCallSpec)?
    '}';

PrepareToolCallSpec:
    PrepareToolCallTrue | PrepareToolCallBody;

PrepareToolCallTrue:
    {infer PrepareToolCallTrue} 'true';

PrepareToolCallBody:
    {infer PrepareToolCallBody} '{' 'clientMayOmit' ':' '[' (clientMayOmit+=[SqlParamEntry:ID] (',' clientMayOmit+=[SqlParamEntry:ID])*)? ']' '}';

AccessKind:
    PublicAccess | ProtectedAccess;

PublicAccess:
    {infer PublicAccess} 'public';

ProtectedAccess:
    {infer ProtectedAccess} 'protected';

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

Boolean returns boolean:
    'true' | 'false';

DslText returns string:
    STRING | MULTILINE_STRING;

terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal MULTILINE_STRING: /'''[\s\S]*?'''|"""[\s\S]*?"""/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
