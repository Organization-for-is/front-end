import { catalog } from './catalog.js';

const json = (schema, example) => ({'application/json': {schema, example}});
const ok = (description, example) => ({description, content:{'application/json':{example}}});
const notFound = ok('Convocatoria no encontrada', {error:'Convocatoria no encontrada'});
const invalid = ok('Solicitud inválida', {error:'JSON inválido'});
const tooLarge = ok('El cuerpo supera 32 KiB', {error:'Cuerpo demasiado grande'});
const id = {name:'id', in:'path', required:true, schema:{type:'string'}, example:catalog[0].id};
const text = {type:'string'};
const evidence = {type:'object', description:'Referencias de documentos por identificador de requisito.', additionalProperties:text};
const exampleEvidence = {experiencia:'Contrato 01'};
const exampleProfile = {company:'Empresa Demo', ruc:'20123456789'};
const amount = {type:'number', minimum:0, maximum:1e7};

export const openapi = {
  openapi:'3.0.3',
  info:{title:'Radar Público API', version:'1.0.0', description:'API de demostración. Ejecuta GET /api/health para comprobar que el servicio responde.'},
  servers:[{url:'/'}],
  paths:{
    '/api/health':{get:{summary:'Comprobar el estado de la API', responses:{200:ok('Servicio disponible',{status:'ok',demo:true})}}},
    '/api/opportunities':{get:{
      summary:'Buscar convocatorias',
      parameters:[['q','limpieza'],['region','Lima'],['category','Limpieza']].map(([name,example]) => ({name,in:'query',schema:text,example})),
      responses:{200:ok('Resultados de la consulta',{items:[catalog[0]],total:1,demo:true})},
    }},
    '/api/opportunities/{id}':{get:{
      summary:'Consultar un expediente', parameters:[id], responses:{200:ok('Expediente de ejemplo',catalog[0]),404:notFound},
    }},
    '/api/opportunities/{id}/review':{post:{
      summary:'Revisar evidencias declaradas', parameters:[id],
      requestBody:{required:true,content:json({type:'object',properties:{evidence}},{evidence:exampleEvidence})},
      responses:{200:ok('Resultado de la revisión',{
        requirements:catalog[0].requirements.map((entry,index) => ({...entry,document:index === 0 ? 'Contrato 01' : '',status:index === 0 ? 'registrado' : 'pendiente'})),
        pending:catalog[0].requirements.slice(1).map(entry => entry.title),
      }),400:invalid,404:notFound,413:tooLarge},
    }},
    '/api/opportunities/{id}/draft':{post:{
      summary:'Generar un borrador de oferta', parameters:[id],
      requestBody:{required:true,content:json({type:'object',properties:{profile:{type:'object',properties:{company:text,ruc:text}},evidence}},{profile:exampleProfile,evidence:exampleEvidence})},
      responses:{200:ok('Borrador editable',{text:'BORRADOR DE DEMOSTRACIÓN\nPostor: Empresa Demo',pending:catalog[0].requirements.slice(1).map(entry => entry.title)}),400:invalid,404:notFound,413:tooLarge},
    }},
    '/api/estimate':{post:{
      summary:'Calcular la estimación de costos',
      requestBody:{required:true,content:json({type:'object',required:['lines'],properties:{lines:{type:'array',maxItems:50,items:{
        type:'object',required:['name','quantity','unitCost'],properties:{name:text,quantity:amount,unitCost:{...amount,nullable:true,description:'Usa null si falta cotizar.'}},
      }}}},{lines:[{name:'Personal',quantity:10,unitCost:50},{name:'Insumos',quantity:1,unitCost:null}]})},
      responses:{200:ok('Total en soles y partidas pendientes',{lines:[{name:'Personal',subtotal:500},{name:'Insumos',subtotal:null}],total:500,pending:1}),400:invalid,413:tooLarge},
    }},
  },
};
