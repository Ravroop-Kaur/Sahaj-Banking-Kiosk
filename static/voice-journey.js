/* Deterministic voice workflow. Transport, UI, and speech are injected for tests. */
(function(root){
  'use strict';
  class VoiceJourney {
    constructor(actions){this.a=actions;this.epoch=0;this.reset();}
    reset(){this.epoch++;this.stage='request';this.service='';this.amount='';this.candidate='';this.profile=null;this.busy=false;this.misses=0;this.lastPrompt=['request',{}];}
    async start(){this.reset();await this.prompt('request');}
    async prompt(key,values={}){this.lastPrompt=[key,values];this.a.stage(this.stage);await this.a.prompt(key,values);}
    async repeat(){await this.prompt(...this.lastPrompt);}
    async retry(){if(this.busy)return;this.misses++;if(this.misses>=3)this.a.fallback();await this.repeat();}
    async speechFailure(){if(this.busy)return;this.misses++;if(this.misses>=2)this.a.fallback();await this.a.prompt('speech-error',{});}
    validAmount(amount){return /^\d{1,7}(?:\.\d{1,2})?$/.test(String(amount))&&Number(amount)>0;}
    async askAmount(){this.stage='amount';this.a.amountScreen(this.service);await this.prompt('amount',{service:this.service});}
    async confirmAmount(amount){
      if(!this.validAmount(amount)){await this.prompt('invalid-amount');return;}
      this.a.invalidate();this.amount=String(amount);this.stage='amount-confirmed';this.a.showAmount(this.amount,this.service);
      await this.prompt('confirm-amount',{amount:this.amount,service:this.service});
    }
    async nextAfterProfile(){if(this.amount)await this.confirmAmount(this.amount);else await this.askAmount();}
    async handle(raw){
      const text=String(raw||'').trim();if(!text||this.busy)return;
      this.a.transcript(text);this.misses=0;
      if(this.a.language(text)){await this.repeat();return;}
      const command=this.a.command(text);
      if(command==='end'){this.reset();this.a.end();return;}
      if(command==='restart'){this.reset();this.a.restart();await this.prompt('request');return;}
      if(command==='manual'){this.a.fallback();await this.a.prompt('fallback',{});return;}
      if(command==='repeat'){await this.repeat();return;}
      const token=this.epoch;this.busy=true;
      try{
        const yes=this.a.yes(text),no=this.a.no(text);
        if(this.stage==='request'){
          const result=await this.a.intent(text);if(token!==this.epoch)return;
          if(result.intent==='help'){await this.prompt('services');return;}
          if(result.intent==='opening'){this.a.openAccount?.();return;}
          if(result.intent==='unsupported'){await this.prompt('unsupported');return;}
          if(!['withdrawal','deposit'].includes(result.intent)){await this.prompt('unclear');return;}
          this.service=result.intent;this.amount=this.validAmount(result.amount)?String(result.amount):'';
          this.stage='consent';await this.prompt('consent');return;
        }
        if(this.stage==='consent'){
          if(no){this.a.fallback();await this.prompt('consent-declined');return;}
          if(!yes){await this.repeat();return;}
          await this.a.consent();if(token!==this.epoch)return;
          this.stage='passbook';this.a.passbooks();await this.prompt('passbook');return;
        }
        if(this.stage==='passbook'){
          const number=this.a.passbookNumber(text);
          if(!number){await this.prompt('passbook');return;}
          const candidate=await this.a.readPassbook(number);if(token!==this.epoch)return;
          if(!candidate){this.misses++;if(this.misses>=2)this.a.fallback();await this.prompt('ocr-error');return;}
          this.candidate=candidate;this.profile=await this.a.lookup(candidate);if(token!==this.epoch)return;if(!this.profile){await this.prompt('no-match');return;}await this.nextAfterProfile();return;
        }
        if(this.stage==='account-confirm'){
          if(no){this.stage='passbook';this.a.passbooks();await this.prompt('passbook');return;}
          if(!yes){await this.repeat();return;}
          const profile=await this.a.lookup(this.candidate);if(token!==this.epoch)return;
          if(!profile){this.stage='passbook';this.a.passbooks();await this.prompt('no-match');return;}
          this.profile=profile;this.stage='profile-confirm';await this.prompt('profile',{name:profile.name,branch:profile.branch});return;
        }
        if(this.stage==='profile-confirm'){
          if(no){this.profile=null;this.stage='passbook';this.a.passbooks();await this.prompt('passbook');return;}
          if(!yes){await this.repeat();return;}
          this.a.confirmProfile();await this.nextAfterProfile();return;
        }
        if(this.stage==='amount'||this.stage==='amount-confirmed'||this.stage==='download'){
          if(this.stage==='download'&&(command==='download'||yes)){
            const ok=await this.a.download(this.service);if(token!==this.epoch)return;
            if(ok){this.stage='done';await this.prompt('done');}else await this.prompt('download-error');return;
          }
          if(no||command==='change'){this.a.invalidate();this.amount='';await this.askAmount();return;}
          if(this.stage==='amount-confirmed'&&yes){
            const result=await this.a.prepare(this.service,this.amount,this.profile);if(token!==this.epoch)return;
            if(result==='balance'){this.amount='';this.stage='amount';await this.prompt('balance');return;}
            if(result!=='ready'){this.stage='amount';await this.prompt('prepare-error');return;}
            this.stage='download';await this.prompt('download',{amount:this.amount,service:this.service,last4:this.candidate.slice(-4)});return;
          }
          const amount=this.a.amount(text);
          if(amount){await this.confirmAmount(amount);return;}
          await this.repeat();return;
        }
        if(this.stage==='done'){if(yes){this.reset();this.a.end();}else await this.prompt('done');}
      }catch(error){if(token===this.epoch){this.a.error(error);this.a.fallback();await this.a.prompt('speech-error',{});}}
      finally{if(token===this.epoch)this.busy=false;}
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=VoiceJourney;
  else root.SahajVoiceJourney=VoiceJourney;
})(globalThis);
