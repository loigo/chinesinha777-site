import{aY as e,b3 as a,l as s,am as o,aV as t,ah as n,bF as i,c as r,bp as l,r as g,aN as d,V as u,bG as p}from"./index-Bxx4mSPk.js";
import{u as c}from"./use-quasar-DLMazzJX.js";

/** kind: empty | email | phone */
function __ch7Detect(v){
  const s=String(v||"").trim();
  if(!s)return"empty";
  // @ ou letras ⇒ e-mail (evita "telefone inválido" enquanto digita)
  if(s.includes("@")||/[a-zA-Z]/.test(s))return"email";
  if(/^[\d\s().+\-]+$/.test(s))return"phone";
  return"email";
}
function __ch7IsEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim())}
function __ch7IsPhone(v){
  let d=String(v||"").replace(/\D/g,"");
  if((d.length===12||d.length===13)&&d.startsWith("55"))d=d.slice(2);
  return d.length===10||d.length===11;
}
function __ch7LoginIdRule(val){
  const s=String(val||"").trim();
  if(!s)return"Informe e-mail ou telefone";
  if(__ch7Detect(s)==="email")return __ch7IsEmail(s)||"E-mail inválido";
  return __ch7IsPhone(s)||"Número de telefone inválido (use DDD + número)";
}
function __ch7RegPhoneRule(val){
  const s=String(val||"").trim();
  if(!s)return"Número de telefone inválido (use DDD + número)";
  return __ch7IsPhone(s)||"Número de telefone inválido (use DDD + número)";
}

/** Normaliza resposta de login/regist → userInfoData seguro */
function pickUserInfo(res){
  const data=res?.data??res??{};
  const raw=data.userInfoData??data.UserInfoData??data.user??data.User??data;
  if(!raw||typeof raw!=="object"){
    return{token:"local-dev-token",id:"1",gateAddr:""};
  }
  return{
    token:raw.token??raw.Token??data.token??data.Token??"local-dev-token",
    id:String(raw.id??raw.UID??raw.uid??data.id??"1"),
    gateAddr:raw.gateAddr??raw.GateAddr??"",
    phone:raw.phone??raw.Phone??"",
    nick:raw.nick??raw.name??"",
    name:raw.name??raw.nick??"",
    email:raw.email??""
  };
}

function isEmail(v){
  return __ch7IsEmail(v);
}

function isPhone(v){
  return __ch7IsPhone(v);
}

/** Monta phone/email para API sem duplicar DDI 55 */
function buildPhoneForApi(raw, countryFn){
  const s=String(raw||"").trim();
  if(__ch7Detect(s)==="email") return s;
  let digits=s.replace(/\D/g,"");
  if(digits.startsWith("55")&&digits.length>=12) return digits;
  const ddi=String(typeof countryFn==="function"?countryFn():"55").replace(/\D/g,"")||"55";
  if(digits.startsWith(ddi)&&digits.length>=12) return digits;
  return ddi+digits;
}

const h=(h,m)=>{
  const f=c(),{t:v}=a(),y=s(),w=o(),D=t(),
  _=r({get:()=>h.modelValue,set(e){m("update:modelValue",e)}}),
  b=r((()=>1===y.loginType?"login":"register")),
  C=g(!0),
  E=d({phone:"",password:""}),
  S=g(!1),
  // Login: até 80 (e-mail); cadastro nativo SPA: 11 dígitos (form v9 cobre cadastro real)
  V=r((()=>"login"===b.value?80:("es-MX"===u?10:11))),
  // rules inteligentes
  T=r((()=>[
    (val)=>{
      if("login"===b.value) return __ch7LoginIdRule(val);
      return __ch7RegPhoneRule(val);
    }
  ]));

  return{
    isOpen:_,
    activeTab:b,
    isPwd:C,
    form:E,
    btnLoading:S,
    onSubmit:async()=>{
      try{
        S.value=!0;
        const share=D?.shareCode;
        const raw=String(E.phone||"").trim();
        // login: validação forte
        if("login"===b.value){
          const rule=__ch7LoginIdRule(raw);
          if(rule!==true)throw new Error(typeof rule==="string"?rule:"Dados inválidos");
          if(String(E.password||"").length<6)throw new Error("A senha deve ter no mínimo 6 caracteres.");
        }
        const phoneForApi=
          "login"===b.value
            ? buildPhoneForApi(raw, i)
            : (String(i()||"55").replace(/\D/g,"")+raw.replace(/\D/g,""));
        const payload={phone:phoneForApi,pass:E.password,Adid:p(),GPSAdid:p(),Share:share,shareCode:share};
        if(__ch7Detect(raw)==="email"){
          payload.email=raw;
          payload.Email=raw;
          payload.phone=raw;
          payload.account=raw;
        }

        if("login"===b.value){
          const res=await e.request("post","/gofun/v2/account/login",{data:payload});
          if(0!==res?.code)throw new Error(res?.msg||v("loginDialog.unknown_error"));
          w.setUserData(pickUserInfo(res));
          f.notify({type:"positive",message:v("loginDialog.login_success")});
          _.value=!1;
          if(D)D.shareCode="";
        }else{
          const res=await e.request("post","/gofun/v2/account/regist",{data:payload});
          if(0!==res?.code)throw new Error(res?.msg||v("loginDialog.unknown_error"));
          w.setUserData(pickUserInfo(res));
          f.notify({type:"positive",message:v("loginDialog.register_success")});
          _.value=!1;
          if(D)D.shareCode="";
        }
      }catch(err){
        f.notify({type:"negative",message:err instanceof Error?err.message:v("loginDialog.unknown_error")});
      }finally{
        S.value=!1;
      }
    },
    VITE_BANNER_URL:l,
    gameStore:y,
    maxlengthPhone:V,
    phoneRules:T,
    getCountryCallingCodeByLocale:i,
    VITE_ASSETS_URL:n
  };
};

export{h as u};
