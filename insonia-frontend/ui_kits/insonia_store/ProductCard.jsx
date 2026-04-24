// Product card
function ProductCard({ p, onOpen }) {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  const promo = p.from && p.from > p.price;
  return (
    <div className="pcard" onClick={() => onOpen && onOpen(p)}>
      <div className="pimg">
        {p.tag && <span className={`tag ${p.tag==='Promoção'?'promo':''}`}>{p.tag}</span>}
        <button className="fav" onClick={(e)=>e.stopPropagation()}><i data-lucide="heart"></i></button>
        <span>{p.letra}</span>
      </div>
      <div className="pbody">
        <div className="pbrand">{p.brand}</div>
        <div className="pname">{p.name}</div>
        <div className="pprices">
          {promo && <span className="pfrom">{fmt(p.from)}</span>}
          <span className={`pprice ${promo?'promo':''}`}>{fmt(p.price)}</span>
          <span className="pinstall">{installments(p.price)}</span>
        </div>
        <button className="pbtn" onClick={(e)=>{ e.stopPropagation(); addToCart(p); }}>
          <i data-lucide="shopping-bag"></i>Adicionar
        </button>
      </div>
    </div>
  );
}

window.ProductCard = ProductCard;
