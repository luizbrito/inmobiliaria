// Transport submission is not delivery. Confirmed delivery/read outranks an old failure.
const transitions={
 sending:['submitted','observed','uncertain','failed','sent','delivered','read'],
 submitted:['failed','sent','delivered','read'],
 observed:['failed','sent','delivered','read'],
 uncertain:['failed','sent','delivered','read'],
 failed:['sent','delivered','read'],
 sent:['failed','delivered','read'],
 delivered:['read'],read:[],
};
export const qrDeliveryState=(current,event)=>transitions[current]?.includes(event)?event:current;
