grammar Db2AiDsl

entry Model:
    'database' (dialect=DatabaseDialect)? 'env' env=STRING
    (entries += ModelEntry)*;

DatabaseDialect returns string:
    'postgres' | 'postgresql' | 'mysql';

ModelEntry:
    TableQuery | SqlQuery;

TableQuery:
    'SELECT' '*' 'FROM' table=TableName '{'
        ('toolName' ':' toolName=STRING)?
        ('intent' ':' intent=STRING)?
        ('summary' ':' summary=STRING)?
        ('example' ':' example=STRING)?
        ('maxLimit' ':' maxLimit=INT)?
        ('columns' ':' columns=ColumnDescriptions)?
    '}';

SqlQuery:
    'SQL' '{'
        ('toolName' ':' toolName=STRING)?
        ('intent' ':' intent=STRING)?
        ('query' ':' query=STRING)?
        ('summary' ':' summary=STRING)?
        ('params' ':' params=SqlParamMap)?
    '}';

ColumnDescriptions:
    '{' (entries += ColumnDescriptionEntry)* '}';

ColumnDescriptionEntry:
    name=ID ':' description=STRING;

SqlParamMap:
    '{' (entries += SqlParamEntry)* '}';

SqlParamEntry:
    placeholder=PARAM_REF ':' spec=SqlParamSpec;

SqlParamSpec:
    '{' (fields += SqlParamSpecField)* '}';

SqlParamSpecField:
    'name' ':' name=ID |
    'description' ':' description=STRING |
    'example' ':' example=STRING |
    'type' ':' paramType=SqlParamType;

SqlParamType returns string:
    'string' | 'integer' | 'number' | 'boolean';

TableName:
    name=ID;

terminal PARAM_REF: /\$[0-9]+/;
terminal INT: /[0-9]+/;
terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
