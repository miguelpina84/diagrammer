class ExportManager {
    constructor(state) {
        this.state = state;
    }

    exportAsImage() {
        const s = this.state;
        if(s.elements.length === 0) return alert('No hay elementos para exportar');
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        s.elements.forEach(el => {
            minX = Math.min(minX, el.x); minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height);
        });
        const PAD = 40;
        const W = maxX - minX + PAD * 2, H = maxY - minY + PAD * 2;
        const c = document.createElement('canvas');
        c.width = W * 2; c.height = H * 2;
        const ctx = c.getContext('2d');
        ctx.scale(2, 2);
        ctx.translate(PAD - minX, PAD - minY);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(minX - PAD, minY - PAD, W, H);
        ctx.fillStyle = '#cbd5e1';
        for(let gx = Math.floor(minX/20)*20; gx <= maxX; gx += 20)
            for(let gy = Math.floor(minY/20)*20; gy <= maxY; gy += 20) { ctx.beginPath(); ctx.arc(gx, gy, 1.5, 0, Math.PI*2); ctx.fill(); }

        const colors = { service: '#3b82f6', database: '#10b981', frontend: '#ec4899', queue: '#f59e0b', '': '#8b5cf6' };

        s.connections.forEach(conn => {
            const fe = s.elements.find(e => conn.from.startsWith(e.id)), te = s.elements.find(e => conn.to.startsWith(e.id));
            if(!fe || !te) return;
            const fp = conn.from.split(':')[1], tp = conn.to.split(':')[1];
            const pp = (el, p) => ({ top:[el.x+el.width/2,el.y], bottom:[el.x+el.width/2,el.y+el.height], left:[el.x,el.y+el.height/2], right:[el.x+el.width,el.y+el.height/2] }[p]||[el.x+el.width/2,el.y+el.height/2]);
            const p1 = pp(fe,fp), p2 = pp(te,tp);
            const dx = Math.min(Math.abs(p2[0]-p1[0])*0.5,150), dy = Math.min(Math.abs(p2[1]-p1[1])*0.5,150);
            const dir = {top:-1,bottom:1,left:-1,right:1}, o1=dir[fp]||1, o2=dir[tp]||1;
            const hf = fp==='left'||fp==='right', ht = tp==='left'||tp==='right';
            const cp1 = [hf?p1[0]+dx*o1:p1[0], hf?p1[1]:p1[1]+dy*o1];
            const cp2 = [ht?p2[0]+dx*o2:p2[0], ht?p2[1]:p2[1]+dy*o2];
            const col = conn.style==='solid'?'#475569':conn.style==='dashed'?'#f59e0b':'#8b5cf6';
            ctx.beginPath(); ctx.moveTo(p1[0],p1[1]); ctx.bezierCurveTo(cp1[0],cp1[1],cp2[0],cp2[1],p2[0],p2[1]);
            ctx.strokeStyle = col; ctx.lineWidth = 2;
            if(conn.style==='dashed') ctx.setLineDash([6,4]); else if(conn.style==='dotted') ctx.setLineDash([2,3]); else ctx.setLineDash([]);
            ctx.stroke(); ctx.setLineDash([]);
            const ang = Math.atan2(p2[1]-cp2[1],p2[0]-cp2[0]);
            ctx.beginPath(); ctx.moveTo(p2[0],p2[1]);
            ctx.lineTo(p2[0]-10*Math.cos(ang)-4*Math.sin(ang),p2[1]-10*Math.sin(ang)+4*Math.cos(ang));
            ctx.lineTo(p2[0]-10*Math.cos(ang)+4*Math.sin(ang),p2[1]-10*Math.sin(ang)-4*Math.cos(ang));
            ctx.closePath(); ctx.fillStyle = col; ctx.fill();
            if(conn.label) {
                const mx=(p1[0]+p2[0])/2, my=(p1[1]+p2[1])/2;
                ctx.font='11px Segoe UI'; ctx.textAlign='center'; ctx.textBaseline='middle';
                const tw=ctx.measureText(conn.label).width;
                ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillRect(mx-tw/2-4,my-8,tw+8,16);
                ctx.fillStyle='#1e293b'; ctx.fillText(conn.label,mx,my);
            }
        });

        s.elements.forEach(el => {
            const col = colors[el.subtype]||'#8b5cf6';
            ctx.fillStyle='rgba(0,0,0,0.06)'; this.roundRect(ctx,el.x+3,el.y+3,el.width,el.height,6); ctx.fill();
            ctx.fillStyle='white'; ctx.strokeStyle=col; ctx.lineWidth=2; this.roundRect(ctx,el.x,el.y,el.width,el.height,6); ctx.fill(); ctx.stroke();
            ctx.fillStyle=col; this.roundRect(ctx,el.x+2,el.y+2,el.width-4,28,4); ctx.fill();
            ctx.fillStyle='white'; ctx.font='bold 13px Segoe UI'; ctx.textAlign='left'; ctx.textBaseline='middle';
            ctx.fillText(el.label,el.x+10,el.y+16);
            if(el.description) {
                ctx.fillStyle='#475569'; ctx.font='12px Segoe UI'; ctx.textAlign='left'; ctx.textBaseline='top';
                const s = el.description.length > 30 ? el.description.slice(0,30)+'…' : el.description;
                ctx.fillText(s,el.x+10,el.y+36);
            }
        });
        const a=document.createElement('a'); a.download='diagrama.png'; a.href=c.toDataURL('image/png'); a.click();
    }

    roundRect(ctx,x,y,w,h,r) {
        ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
        ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
        ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
        ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
    }
}
