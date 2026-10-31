/* Bounded focus restoration for course-list pages only. */
function focus(page) {
    clearTimeout(page._focusTimer);
    var gen=page._uiGen,tries=0;
    function apply() {
        page._focusTimer=null;
        if(page.dead||!page.ready||gen!==page._uiGen)return;
        var ref=page.$refs&&page.$refs.courseList;
        if(ref&&ref.rotation){ref.rotation({focus:true});}
        else if(++tries<3){page._focusTimer=setTimeout(apply,32);}
    }
    page._focusTimer=setTimeout(apply,32);
}
export default focus;
