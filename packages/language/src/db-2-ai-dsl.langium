grammar Db2AiDsl

entry Model:
    'database' (dialect=DatabaseDialect)? 'env' env=STRING
    (auth?='auth')?
    (entries += SqlQuery)*;

DatabaseDialect returns string:
    'postgres' | 'postgresql' | 'mysql';

SqlQuery:
    'SQL' '{'
        ('toolName' ':' toolName=ID)?
        'access' ':' access=Access
        ('intent' ':' intent=STRING)?
        ('query' ':' query=STRING)?
        ('summary' ':' summary=STRING)?
        ('params' ':' params=SqlParamMap)?
    '}';

Access:
    PublicAccess | ProtectedAccess | CheckedAccess;

PublicAccess:
    {infer PublicAccess} 'public';

ProtectedAccess:
    {infer ProtectedAccess} 'protected';

CheckedAccess:
    {infer CheckedAccess} 'checked' ('{' checkedBody=CheckedAccessBody '}')?;

CheckedAccessBody:
    ('optionalParams' ':' '[' (optionalParams+=[SqlParamNameField:ID] (',' optionalParams+=[SqlParamNameField:ID])*)? ']')?;

SqlParamMap:
    '{' (entries += SqlParamEntry)* '}';

SqlParamEntry:
    placeholder=PARAM_REF ':' spec=SqlParamSpec;

SqlParamSpec:
    '{' (fields += SqlParamSpecField)* '}';

SqlParamSpecField:
    SqlParamNameField |
    'description' ':' description=STRING |
    'example' ':' example=STRING |
    'type' ':' paramType=SqlParamType;

SqlParamNameField:
    'name' ':' name=ID;

SqlParamType returns string:
    'string' | 'integer' | 'number' | 'boolean';

terminal PARAM_REF: /\$[0-9]+/;
terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
