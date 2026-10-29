const {test}=require('node:test');const assert=require('node:assert/strict');const {replaceMods}=require('../src/profiles.cjs');
test('préserve les autres informations et écrit les mods dans le sens du profil',()=>{
const s='SiiNunit\n{\nprofile : _x {\n name: "Pilote"\n active_mods: 1\n active_mods[0]: "old"\n money: 123\n}\n}';
const r=replaceMods(s,['first','second']);assert.match(r,/money: 123/);assert.match(r,/active_mods\[0\]: "second"/);assert.match(r,/active_mods\[1\]: "first"/);assert.doesNotMatch(r,/"old"/);
});
test('refuse les formats inconnus et les identifiants injectés',()=>{assert.throws(()=>replaceMods('ScsC',[]));assert.throws(()=>replaceMods('SiiNunit\n{profile : x {\n active_mods: 0\n}}',['a"b']));});
