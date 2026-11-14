// Host packaging only: alpha-rename function-local variables on the one receive page.
// No expression compression, property/toplevel mangling, function-name change or runtime helper.
import {minify} from '../tools/sign/node_modules/terser/main.js';
export const options={
  compress:false,
  mangle:{toplevel:false,keep_fnames:true,keep_classnames:true,
    reserved:['$app','FeatureAbility','__webpack_require__']},
  ecma:5,
  format:{comments:false,ascii_only:true}
};
export async function compact(source,name) {
  const result=await minify({[name]:source},{...options,
    sourceMap:{filename:name.split('/').pop(),url:name.split('/').pop()+'.map',includeSources:true}});
  if(typeof result.code!=='string'||!result.map)throw new Error('Missing alpha-rename output');
  return result;
}
