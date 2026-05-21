grammar Db2AiDsl

entry Model:
    'database' 'env' env=STRING
    (queries += Query)*;

Query:
    'SELECT' '*' 'FROM' table=TableName '{'
        (
              'toolName' ':' toolName=STRING
            | 'intent' ':' intent=STRING
            | 'example' ':' example=STRING
            | 'summary' ':' summary=STRING
            | 'maxLimit' ':' maxLimit=INT
        )*
    '}';

TableName:
    name=ID;

terminal INT: /[0-9]+/;
terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
