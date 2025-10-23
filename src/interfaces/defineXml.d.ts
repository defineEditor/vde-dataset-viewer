import {
    ArmDefine20,
    ArmDefine21,
    Define20,
    Define21,
    DefineXml,
} from 'parse-define-xml';

// Helper type to ensure correct content type based on version and arm
type DefineXmlContentType<
    V extends '2.0' | '2.1',
    A extends boolean,
> = V extends '2.0'
    ? A extends true
        ? ArmDefine20.DefineXml
        : Define20.DefineXml
    : A extends true
      ? ArmDefine21.DefineXml
      : Define21.DefineXml;

// Type-safe content interface using conditional types
export interface DefineXmlContent {
    defineVersion: '2.0' | '2.1';
    arm: boolean;
    type: 'json' | 'xml';
    content: DefineXmlContentType<
        DefineXmlContent['defineVersion'],
        DefineXmlContent['arm']
    >;
}

export type { DefineXml };
