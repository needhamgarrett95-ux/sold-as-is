// Sold As-Is — listing detail view
const Detail = {
  current: null,
  offer: null,

  open(id) {
    const l = Feed.listings.find(x => x.id === id);
    if (!l) return;
    this.current = l;
    this.offer = null;
    this._lastCounter = null; // fresh negotiation
    this._haggleRounds = 0;
    this.thread = [];
    this.haggleResponse = null;
    this.blocked = false;
    this.retryUsed = false;
    this.notice = null;
    this.render();
    document.getElementById("detail").classList.remove("hidden");
    document.getElementById("feed").style.display = "none";
  },

  close() {
    document.getElementById("detail").classList.add("hidden");
    document.getElementById("feed").style.display = "";
    this.current = null;
  },

  // Haggle: player sends a numeric offer, seller responds intelligently
  // Returns { response, accepted, price } — price is the buyable amount
  _lastHaggle: null,
  pickReply(options) {
    this._recentHaggles = this._recentHaggles || [];
    let pool = options.filter(o => !this._recentHaggles.includes(o));
    if (!pool.length) pool = options;
    const pick = pool[(Math.random() * pool.length) | 0];
    this._recentHaggles.push(pick);
    if (this._recentHaggles.length > 3) this._recentHaggles.shift();
    return pick;
  },

  _removeBlockedListing(passedListing) {
    // Seller blocked you — listing is replaced with a fresh one
    const l = passedListing || this.current;
    if (l && typeof Feed !== "undefined" && Feed.replaceBlocked) {
      Feed.replaceBlocked(l.id);
    }
    // Activity notification (silent — red dot, no sound)
    if (l) {
      try {
        const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
        const blockMsgs = [
          `${l.seller || "Seller"} blocked you. The ${l.brand} ${l.model} is gone forever. Smooth.`,
          `You got blocked by ${l.seller || "the seller"}. The ${l.brand} ${l.model} listing has left the chat.`,
          `${l.seller || "Seller"} hit the block button. That ${l.brand} ${l.model} will never know your love.`,
        ];
        feed.unshift({ msg: blockMsgs[(Math.random() * blockMsgs.length) | 0], at: Date.now(), cat: "marketplace" });
        if (feed.length > 50) feed.length = 50;
        localStorage.setItem("soldasis_activity", JSON.stringify(feed));
        if (typeof UI !== "undefined" && UI.updateBellBadge) UI.updateBellBadge();
      } catch (e) {}
    }
    // Close detail after a beat so they see the block message, then refresh feed
    setTimeout(() => {
      this.close();
      if (typeof Views !== "undefined" && Views.current === "market") {
        Views.renderMarketFeed();
        Views.renderMarketTabs();
      }
    }, 2500);
  },
  sendOffer(rawInput) {
    const l = this.current;
    // Numerals only
    const digits = String(rawInput).replace(/[^0-9]/g, "");
    if (!digits) {
      this.haggleResponse = { response: `"Send me a number and we'll talk."`, accepted: false, price: null };
      this.render();
      return;
    }
    const offerPrice = parseInt(digits, 10);
    this._haggleRounds = (this._haggleRounds || 0) + 1;
    // Seller patience: starts round 2, balanced escalation
    // R2: 10% → R3: 25% → R4: 50% → R5+: 75% cap
    if (this._haggleRounds >= 2 && !this.blocked) {
      const chances = [0, 0.10, 0.25, 0.50, 0.75];
      const blockChance = chances[Math.min(this._haggleRounds, 4)];
      if (Math.random() < blockChance) {
        this.blocked = true;
        this.haggleResponse = { response: this.pickReply([
          `"You know what? I'm tired of going back and forth. Deal's off."`,
          `"We've been at this too long. I'm moving on."`,
          `"I don't have all day for this. Find another bike."`,
          `"This is going nowhere. We're done here."`,
        ]), accepted: false, price: null };
        this.render();
        return;
      }
    }
    // Easter egg: the 67 meme
    if (offerPrice === 67) {
      this.thread = this.thread || [];
      this.thread.push({ from: "you", text: money(offerPrice) });
      this.thread.push({ from: "seller", text: `"Are you serious, that meme is dead bro"` });
      this.render();
      return;
    }
    if (offerPrice <= 0) {
      this.haggleResponse = { response: `"Very funny."`, accepted: false, price: null };
      this.render();
      return;
    }
    // Already blocked? Seller wants nothing to do with you.
    if (this.blocked) {
      this.thread.push({ from: "you", text: money(offerPrice) });
      this.thread.push({ from: "seller", text: `"I'm not selling to you. Piss off."` });
      this.render();
      return;
    }
    // Bad faith: trying to go lower AFTER explicitly accepting a deal
    // (a seller counter is NOT an agreement — only a prior accept counts)
    const wasAccepted = this.haggleResponse && this.haggleResponse.accepted;
    const agreedPrice = wasAccepted && this.haggleResponse.price;
    if (agreedPrice && offerPrice < agreedPrice) {
      const angry = [
        `"Are you fucking kidding me? We HAD a deal at ${money(agreedPrice)}."`,
        `"Nah. Fuck this. You had ${money(agreedPrice)} and you got greedy. Deal's dead."`,
        `"Trying to renegotiate down AFTER we agreed? Hell no. I'm done with you."`,
      ];
      this.thread = this.thread || [];
      this.thread.push({ from: "you", text: money(offerPrice) });
      this.thread.push({ from: "seller", text: angry[(Math.random() * angry.length) | 0] });
      this.blocked = true;
      this.haggleResponse = { response: null, accepted: false, price: null };
      const blockedListing = this.current;
      this.render();
      this._removeBlockedListing(blockedListing);
      return;
    }
    this.offer = offerPrice;
    // Smooth Talker: discount boosts effective offer ratio
    const stDiscount = (typeof Skills !== "undefined") ? Skills.haggleDiscount() : 0;
    const effectiveOffer = offerPrice * (1 + stDiscount);
    const ratio = effectiveOffer / l.price;
    let response, accepted = false, price = null;

    // Track consecutive lowballs for unpredictable blocking
    this._lowballStreak = (ratio < 0.50) ? (this._lowballStreak || 0) + 1 : 0;

    if (ratio >= 0.95) {
      response = this.pickReply([
        `"${money(offerPrice)}? Yeah, I can do that."`,
        `"${money(offerPrice)} — deal. When can you pick it up?"`,
        `"You got it for ${money(offerPrice)}. Pleasure doing business."`,
        `"${money(offerPrice)} works. It's yours."`,
        `"Done. ${money(offerPrice)}. I'll even throw in the spare key."`,
        `"${money(offerPrice)}? You got yourself a bike, my friend."`,
        `"Sold! ${money(offerPrice)}. Come get her before I change my mind."`,
        `"${money(offerPrice)} — that's fair. She's all yours."`,
        `"Alright, ${money(offerPrice)}. Cash talks."`,
        `"${money(offerPrice)}. I like your style — no games."`,
        `"Deal at ${money(offerPrice)}. Title's in the drawer, ready to sign."`,
        `"${money(offerPrice)} and she's yours. Good doing business with someone reasonable."`,
        `"${money(offerPrice)}? Done deal. You're gonna love this bike."`,
        `"I'll take ${money(offerPrice)}. Honestly, that's more than fair."`,
        `"${money(offerPrice)} — we have a deal. I'll clean her up before pickup."`,
        `"Wow, ${money(offerPrice)}? I wasn't expecting that. Sold!"`,
        `"${money(offerPrice)}. Finally, someone who doesn't waste my time."`,
        `"Deal. ${money(offerPrice)} cash and she's out of my garage tonight."`,
        `"${money(offerPrice)}? Absolutely. When do you want to come see her?"`,
        `"You know what? ${money(offerPrice)} works. I respect a straight shooter."`,
        `"${money(offerPrice)} — sold to the smartest person in my DMs today."`,
        `"I'm happy with ${money(offerPrice)}. Let's do this."`,
        `"${money(offerPrice)}. That's a solid offer from a solid person."`,
        `"${money(offerPrice)}? Sold. You're easy to deal with."`,
        `"Deal at ${money(offerPrice)}. When works for pickup?"`,
        `"Yep, ${money(offerPrice)} works for me. Cash or Venmo?"`,
        `"You got a deal at ${money(offerPrice)}. I'll have it warmed up."`,
        `"Done — ${money(offerPrice)}. Glad we could skip the games."`,
        `"Alright, ${money(offerPrice)} it is. Come and get her."`,
        `"Sold for ${money(offerPrice)}! I'll text you the address."`,
        `"I can do ${money(offerPrice)}. No problem at all."`,
        `"That's a deal. ${money(offerPrice)}, and she's yours today."`,
        `"Sweet, ${money(offerPrice)} works. I'll dig out the paperwork."`,
        `"${money(offerPrice)}? You drive a fair deal. Sold."`,
        `"Works for me — ${money(offerPrice)}. Let me know when you're coming."`,
        `"Done deal at ${money(offerPrice)}. She's a good one, you'll see."`,
        `"I'm good with ${money(offerPrice)}. Want me to hold it for you?"`,
        `"Sold! ${money(offerPrice)}. First person who didn't waste my time all week."`,
        `"Yeah, ${money(offerPrice)} — let's do it. Bring cash if you can."`,
        `"All yours for ${money(offerPrice)}. I'll even help you load it."`,
        `"${money(offerPrice)} and we have a deal. Nice doing business."`,
        `"Okay! ${money(offerPrice)}. I'll send you my cross streets."`,
        `"Sold at ${money(offerPrice)}. You're gonna have a blast on this thing."`,
        `"Fair price. ${money(offerPrice)}, deal."`,
        `"I accept ${money(offerPrice)}. Come by anytime after 5."`,
        `"Locking it in at ${money(offerPrice)}. See you soon."`,
      ]);
      accepted = true; price = offerPrice;
    } else if (ratio >= 0.85) {
      response = this.pickReply([
        `"Hmm... ${money(offerPrice)}. Alright, it's yours."`,
        `"${money(offerPrice)}? ...Fine. You drive a hard bargain."`,
        `"I was hoping for more, but ${money(offerPrice)} — sold."`,
        `"Okay okay, ${money(offerPrice)}. Don't tell my wife."`,
        `"${money(offerPrice)}. Ugh. Fine. I need the garage space anyway."`,
        `"You're killing me. ${money(offerPrice)} — deal."`,
        `"${money(offerPrice)}... I guess. I shouldn't, but I will."`,
        `"Twist my arm. ${money(offerPrice)}. Sold."`,
        `"${money(offerPrice)} and not a sob story about your budget. Deal?"`,
        `"Fine — ${money(offerPrice)}. You caught me on a good day."`,
        `"${money(offerPrice)}. I'm gonna regret this, aren't I."`,
        `"Okay, ${money(offerPrice)}. But you're buying the coffee when you pick it up."`,
        `"${money(offerPrice)}... alright. But I'm telling everyone I got asking price."`,
        `"Sigh. ${money(offerPrice)}. Fine. It's yours."`,
        `"You're good at this. ${money(offerPrice)} — deal."`,
        `"${money(offerPrice)}? My buddy said don't go below asking. My buddy's wrong."`,
        `"Okay ${money(offerPrice)}. But if she breaks down in a week, we never met."`,
        `"${money(offerPrice)}. Deal. I'm too tired to keep listing this thing."`,
        `"I'll do ${money(offerPrice)}. Mostly because I like your persistence."`,
        `"${money(offerPrice)} — fine. Just come get it before my landlord sees it."`,
        `"Alright, ${money(offerPrice)}. You've worn me down. Congrats."`,
        `"${money(offerPrice)}. That's my 'I want this gone' price. Lucky you."`,
        `"Deal at ${money(offerPrice)}. Please take care of her, she's been good to me."`,
        `"Ugh... ${money(offerPrice)}. Fine. I guess today's your lucky day."`,
        `"You're really gonna make me do ${money(offerPrice)}? ...Okay."`,
        `"I wanted more, but ${money(offerPrice)} — you've got a deal."`,
        `"Fine, ${money(offerPrice)}. My garage thanks you, my wallet doesn't."`,
        `"Twist my arm why don't you. ${money(offerPrice)} — sold."`,
        `"Alright, ${money(offerPrice)}. Don't tell my buddies I caved."`,
        `"Hmm. ${money(offerPrice)}. I suppose I can live with that."`,
        `"You win. ${money(offerPrice)}. Come get it before I reconsider."`,
        `"Okay fine, ${money(offerPrice)}. You're persistent, I'll give you that."`,
        `"I'll take ${money(offerPrice)}, but you're buying me a beer when you pick it up."`,
        `"Deal... ${money(offerPrice)}. I feel like I just lost at poker."`,
        `"Against my better judgment: ${money(offerPrice)}. Sold."`,
        `"Fiiiine. ${money(offerPrice)}. Happy now?"`,
        `"I hate that I'm saying yes to ${money(offerPrice)}. But yes."`,
        `"You got me at a weak moment. ${money(offerPrice)} — deal."`,
        `"Okay, ${money(offerPrice)}. But I'm telling my wife I got full price."`,
        `"Man... alright. ${money(offerPrice)}. It's yours."`,
        `"I'll do ${money(offerPrice)}. Mostly so I stop getting messages about it."`,
        `"Grudging yes at ${money(offerPrice)}. When can you come by?"`,
        `"Fine. ${money(offerPrice)}. You haggle like my mother-in-law."`,
        `"Sold at ${money(offerPrice)}. I'm going to pretend this conversation never happened."`,
        `"Alright alright, ${money(offerPrice)}. You caught me right before dinner."`,
        `"I'll accept ${money(offerPrice)}. Don't push your luck asking for extras."`,
      ]);
      accepted = true; price = offerPrice;
    } else if (ratio >= 0.70) {
      // Counter: meet in the middle between offer and seller's last position
      // (never higher than previous counter — seller only moves down)
      const sellerAnchor = this._lastCounter && this._lastCounter < l.price ? this._lastCounter : l.price;
      const counter = Math.round(((offerPrice + sellerAnchor) / 2) * (1 - stDiscount) / 10) * 10;
      this._lastCounter = counter;
      response = this.pickReply([
        `"${money(offerPrice)}? I could do ${money(counter)}. Meet me there and it's yours."`,
        `"Nah, but I'll meet you at ${money(counter)}."`,
        `"${money(counter)} and we shake on it. Final."`,
        `"Split the difference — ${money(counter)}. Take it or leave it."`,
        `"${money(offerPrice)}'s close. ${money(counter)} and I'll hold it for you."`,
        `"I can do ${money(counter)}. That's my middle ground."`,
        `"How about ${money(counter)}? I'm already cutting you a deal."`,
        `"${money(counter)}. Meet me halfway and it's done."`,
        `"Tell you what — ${money(counter)}, and I'll throw in a helmet."`,
        `"${money(offerPrice)} no, ${money(counter)} yes. Your move."`,
        `"Let's land at ${money(counter)}. I think that's fair for both of us."`,
        `"${money(counter)}. I'm not going lower, but I'm not going higher either."`,
        `"What if we call it ${money(counter)}? I think that's the sweet spot."`,
        `"${money(offerPrice)} is a stretch. ${money(counter)} I can live with."`,
        `"I'll go ${money(counter)}. That's me meeting you more than halfway."`,
        `"${money(counter)} and I'll deliver it within 20 miles. Deal?"`,
        `"Let's do ${money(counter)}. I want this sold as much as you want it bought."`,
        `"${money(counter)}? I can feel good about that number."`,
        `"Okay here's my counter: ${money(counter)}. No games, that's it."`,
        `"${money(offerPrice)} won't work, but ${money(counter)} will. Thoughts?"`,
        `"I'm stuck at ${money(counter)}. It's worth every penny, trust me."`,
        `"${money(counter)} and I'll include the shop manual. Final answer."`,
        `"Meet at ${money(counter)}? I think we both walk away happy."`,
        `"Close, but I was thinking more like ${money(counter)}. Can we meet there?"`,
        `"${money(offerPrice)} is light. I'd take ${money(counter)} today."`,
        `"I hear you. My number is ${money(counter)} — that's fair."`,
        `"How about we split it at ${money(counter)}? I think that's reasonable."`,
        `"Can't do ${money(offerPrice)}, but ${money(counter)} and it's yours."`,
        `"${money(counter)}. That's my counter. Let me know."`,
        `"I'd need ${money(counter)} to let it go. Worth every cent."`,
        `"Meet me at ${money(counter)} and I'll even wash it first."`,
        `"Nah, ${money(offerPrice)} won't cut it. ${money(counter)} — final-ish."`,
        `"What about ${money(counter)}? I think we can both feel good about that."`,
        `"I'll come down to ${money(counter)}. That's a solid deal for you."`,
        `"${money(offerPrice)}... hmm. I could live with ${money(counter)}."`,
        `"Let's call it ${money(counter)} and skip the back-and-forth."`,
        `"My floor is realistically ${money(counter)}. Can you do that?"`,
        `"I'll meet you in the middle at ${money(counter)}. Sound good?"`,
        `"${money(counter)} and I'll throw in the cover. Take it or leave it."`,
        `"I can't go that low, but ${money(counter)} works for me."`,
        `"Counter: ${money(counter)}. I think that's more than fair."`,
        `"Look, ${money(counter)} and we both win. What do you say?"`,
        `"${money(offerPrice)} is a no from me. ${money(counter)} is a yes."`,
        `"Best I can do is ${money(counter)}. It's priced right, trust me."`,
        `"How's ${money(counter)}? I'd rather sell to someone local anyway."`,
        `"I'll do ${money(counter)} cash and we call it a day."`,
      ]);
      price = counter; // buy button updates to counter
    } else if (ratio >= 0.50) {
      // Firm counter at 90% (Smooth Talker discount applied), never above last counter
      let counter = Math.round(l.price * 0.9 * (1 - stDiscount) / 10) * 10;
      if (this._lastCounter && counter > this._lastCounter) counter = this._lastCounter;
      this._lastCounter = counter;
      response = this.pickReply([
        `"${money(offerPrice)}? Come on. ${money(counter)} and we got a deal."`,
        `"${money(offerPrice)} is insulting. ${money(counter)}, not a penny less."`,
        `"I can't do ${money(offerPrice)}. ${money(counter)} is my floor."`,
        `"Ha. ${money(counter)}. That's as low as I go."`,
        `"${money(offerPrice)}? Did you mean ${money(counter)}? Because that's the price."`,
        `"Look, I need ${money(counter)} out of this. That's already a steal."`,
        `"${money(counter)}. I've had three other people ask about this bike."`,
        `"My bottom dollar is ${money(counter)}. I won't budge."`,
        `"${money(offerPrice)} doesn't even cover what I put into it. ${money(counter)}."`,
        `"I appreciate the offer, but ${money(counter)} is where I'm at."`,
        `"${money(counter)} — and I'm doing you a favor at that price."`,
        `"Nope. ${money(counter)}. I've turned down more than ${money(offerPrice)}."`,
        `"${money(offerPrice)}? No. ${money(counter)}. I'm not running a charity here."`,
        `"Listen, ${money(counter)} is already a gift. Take it."`,
        `"I priced this fairly at asking. ${money(counter)} is me being nice."`,
        `"${money(counter)}. And honestly, you're lucky I'm even countering."`,
        `"${money(offerPrice)} tells me you're not serious. ${money(counter)} tells me you are."`,
        `"My price is ${money(counter)}. It's firm because the bike is worth it."`,
        `"${money(counter)} or we both move on. Your call."`,
        `"I can't go below ${money(counter)}. I've got too much into this bike."`,
        `"${money(counter)}. Ask anyone — that's a fair price for this condition."`,
        `"${money(offerPrice)} is a no. ${money(counter)} is a yes. Simple math."`,
        `"Final: ${money(counter)}. I've said it three times now to three people."`,
        `"${money(offerPrice)}? Not happening. ${money(counter)} is the price."`,
        `"I need ${money(counter)} for this. I'm already losing money at that."`,
        `"Look, ${money(counter)}. I'm not negotiating against myself here."`,
        `"My price is ${money(counter)}. It's firm. The bike speaks for itself."`,
        `"${money(counter)} — take it or leave it. I've got others interested."`,
        `"I can't touch ${money(offerPrice)}. ${money(counter)}, firm."`,
        `"Bottom line: ${money(counter)}. I've priced it to sell, not to haggle."`,
        `"${money(counter)} is where I land. That's already below what I wanted."`,
        `"No way on ${money(offerPrice)}. ${money(counter)} and not a dollar less."`,
        `"I've done my research. ${money(counter)} is fair. That's it."`,
        `"${money(counter)}. I'm firm because I know what I have."`,
        `"Sorry, ${money(offerPrice)} doesn't work. ${money(counter)} does."`,
        `"I'm not desperate. ${money(counter)} or I'll wait for the next buyer."`,
        `"${money(counter)}. That's my final number, I mean it this time."`,
        `"Two numbers: ${money(offerPrice)} is yours, ${money(counter)} is mine. Mine wins."`,
        `"I've already dropped the price once. ${money(counter)} is the floor."`,
        `"${money(counter)}. I know what these sell for — don't insult us both."`,
        `"Firm at ${money(counter)}. Come see it in person and you'll understand."`,
        `"My answer is ${money(counter)}. It's a good bike at a good price."`,
        `"${money(offerPrice)} is a joke. ${money(counter)} is the real number."`,
        `"I'll say it once more: ${money(counter)}. After that I'm done talking price."`,
        `"You want it? ${money(counter)}. You don't? Someone else will."`,
        `"Last counter: ${money(counter)}. I'm confident in this bike."`,
      ]);
      price = counter;
    } else {
      // Lowball: unpredictable blocking (more lowballs = more likely to get blocked)
      const blockChance = Math.min(0.15 + (this._lowballStreak - 1) * 0.25, 0.85);
      if (Math.random() < blockChance) {
        const blocks = [
          `"${money(offerPrice)}?? Yeah, we're done here."`,
          `"Get out of my DMs with that ${money(offerPrice)} nonsense."`,
          `"${money(offerPrice)}. Blocked."`,
          `"I'm not desperate. Don't message me again."`,
          `"${money(offerPrice)}. Congratulations, you're the reason I drink."`,
          `"I've sold to better lowballers than you. Goodbye."`,
          `"${money(offerPrice)} was your last message. Ever. To me."`,
          `"I'd rather burn it than sell it for ${money(offerPrice)}. Blocked."`,
          `"${money(offerPrice)}. This is why I hate selling online."`,
          `"Blocked. ${money(offerPrice)} was the last straw."`,
          `"I'm reporting ${money(offerPrice)} to the lowball police."`,
          `"${money(offerPrice)}? Enjoy walking. Blocked."`,
          `"Three strikes. ${money(offerPrice)} was strike three. Gone."`,
          `"I showed your ${money(offerPrice)} offer to my dog. Even he's offended."`,
          `"${money(offerPrice)}. I'm keeping the bike out of spite now."`,
          `"Are you serious with ${money(offerPrice)}? Bye."`,
          `"I don't have time for ${money(offerPrice)} offers. Blocked."`,
          `"${money(offerPrice)}? Yeah no. Don't contact me again."`,
          `"Blocked. People like you are why I dread selling stuff."`,
          `"I'd sell it to a raccoon before I take ${money(offerPrice)}. Gone."`,
          `"${money(offerPrice)}. Wow. Okay. We're done."`,
          `"Nope. Not for ${money(offerPrice)}, not ever. Bye."`,
          `"I'm blocking ${money(offerPrice)} offers on principle now."`,
          `"Find another seller, champ. ${money(offerPrice)} ain't it."`,
          `"${money(offerPrice)}? I just laughed out loud. Blocked."`,
          `"This conversation is over. ${money(offerPrice)} sealed it."`,
          `"I'm done. ${money(offerPrice)} was genuinely the worst one yet."`,
          `"Enjoy your ${money(offerPrice)} budget. Somewhere else. Blocked."`,
          `"${money(offerPrice)} tells me everything I need to know. Goodbye."`,
          `"Blocked. Go lowball someone with less patience. Good luck finding them."`,
        ];
        this.thread = this.thread || [];
        this.thread.push({ from: "you", text: money(offerPrice) });
        this.thread.push({ from: "seller", text: this.pickReply(blocks) });
        this.blocked = true;
        this.haggleResponse = { response: null, accepted: false, price: null };
        const blockedListing2 = this.current;
        this.render();
        this._removeBlockedListing(blockedListing2);
        return;
      }
      response = this.pickReply([
`"${money(offerPrice)}?? No lowballs, bro."`,
        `"${money(offerPrice)}? Be serious."`,
        `"Do I look like a charity? ${money(offerPrice)} — no."`,
        `"${money(offerPrice)} wouldn't buy the seat. Try again."`,
        `"Lol. ${money(offerPrice)}. Good one."`,
        `"My grandma offers better than ${money(offerPrice)} and she's dead."`,
        `"${money(offerPrice)}? I'd rather push it off a cliff."`,
        `"Did your phone autocorrect? Because ${money(offerPrice)} can't be right."`,
        `"${money(offerPrice)}. Buddy, the tires alone are worth more."`,
        `"I'm gonna pretend you didn't send ${money(offerPrice)}."`,
        `"${money(offerPrice)}? What is this, a yard sale?"`,
        `"You can't be serious with ${money(offerPrice)}. Come back with a real number."`,
        `"${money(offerPrice)}? Are you buying a bike or a sandwich?"`,
        `"I've seen better offers on free couches. ${money(offerPrice)} — no."`,
        `"${money(offerPrice)}. Sir, this is a moped, not a lemonade stand."`,
        `"Wow. ${money(offerPrice)}. I'm framing this message."`,
        `"${money(offerPrice)}? My kid's piggy bank has more than that."`,
        `"That's... ${money(offerPrice)}. I'm actually impressed by the audacity."`,
        `"${money(offerPrice)} wouldn't cover the gas I used taking these photos."`,
        `"New strategy: offer me a real number. ${money(offerPrice)} ain't it."`,
        `"${money(offerPrice)}. I'm not mad, I'm just disappointed."`,
        `"You want it for ${money(offerPrice)}? I'll throw in a firm handshake and nothing else."`,
        `"${money(offerPrice)}? I think you left a digit off there, champ."`,
        `"Bless your heart. ${money(offerPrice)}? No."`,
        `"${money(offerPrice)}? Is this a prank?"`,
        `"I'm going to assume ${money(offerPrice)} was a typo."`,
        `"Hard pass on ${money(offerPrice)}, my friend."`,
        `"${money(offerPrice)}. Yeah, that's gonna be a no from me."`,
        `"You miss 100% of the shots you... wait, ${money(offerPrice)}? Just no."`,
        `"I admire the confidence behind ${money(offerPrice)}. Still no."`,
        `"${money(offerPrice)}? I'd get more parting it out. Which I might."`,
        `"Come on. ${money(offerPrice)}? At least buy me dinner first."`,
        `"That's a no on ${money(offerPrice)}. A strong no. A resounding no."`,
        `"${money(offerPrice)} — did you mean to add another zero?"`,
        `"I listed it at my price for a reason. ${money(offerPrice)} is not the reason."`,
        `"Nope nope nope. ${money(offerPrice)} is a non-starter."`,
        `"${money(offerPrice)}? My coffee this morning cost more. Relatively."`,
        `"I'm not even mad. ${money(offerPrice)} is just... no."`,
        `"Try again with ${money(offerPrice)} times two and we'll talk."`,
        `"${money(offerPrice)}? I think you confused me with a donation center."`,
        `"That's cute. ${money(offerPrice)}. No."`,
        `"For ${money(offerPrice)} I'd rather keep it as garage art."`,
        `"${money(offerPrice)}? The ad says the price. The price is the price."`,
        `"I'm going to need you to be so for real right now. ${money(offerPrice)}? No."`,
        `"${money(offerPrice)}. Alright, I've had my laugh for the day. Real offer?"`,
        `"Declined. ${money(offerPrice)} wouldn't even cover my listing fee. (There is none.)"`,
      ]);
    }
    // Track the thread
    this.thread = this.thread || [];
    this.thread.push({ from: "you", text: money(offerPrice) });
    this.thread.push({ from: "seller", text: response });
    this.haggleResponse = { response, accepted, price };
    this.render();
    // Keep input focused for quick follow-up offers
    const inp = document.getElementById("offer-input");
    if (inp) inp.focus();
  },

  buyNow() {
    const l = this.current;
    // Buyable price: accepted offer, seller counter, or asking price
    const price = (this.haggleResponse && this.haggleResponse.price)
      ? this.haggleResponse.price : l.price;
    if (!State.canAfford(price)) {
      this.notice = "Not enough cash for this one.";
      this.render();
      return;
    }
    const wasDanny = !!l.isDanny;
    // Carry over Gear Head reveals — parts you could see in the listing stay revealed
    const gh = (typeof Skills !== "undefined") ? Skills.tier("gearhead") : 0;
    let revealedParts = [];
    if (gh > 0 && l.partStates) {
      const parts = availableParts(l.sprite);
      if (gh >= 3) {
        revealedParts = parts.map(p => p.key);
      } else {
        const seed = (l.id || 0) * 9301 + 49297;
        const scored = parts.map(p => ({
          p,
          h: (seed * (p.key.charCodeAt(0) * 7 + p.key.length)) % 1000
        })).sort((a, b) => a.h - b.h);
        const count = gh === 1 ? 3 : Math.ceil(parts.length * 0.6);
        revealedParts = scored.slice(0, count).map(x => x.p.key);
      }
    }
    const buyResult = State.buy({ ...l, price, revealedParts });
    if (!buyResult) {
      this.notice = "Purchase failed.";
      this.render();
      return;
    }
    Feed.remove(l.id);
    // Eliseo_M always has a listing — put up a fresh one
    if (wasDanny && typeof Feed !== "undefined") {
      Feed.ensureDanny();
    }
    this.close();
    UI.refreshCash();
  },

  render() {
    const l = this.current;
    const el = document.getElementById("detail");
    const hr = this.haggleResponse;
    el.innerHTML = `
    <div class="detail-scroll">
      <button class="back-btn" id="d-back">← Back</button>
      <div class="d-photo">
        <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}" draggable="false">
        <div class="photo-count">${Icon.get('camera')} ${l.photos}</div>
      </div>
      <div class="d-body">
        <div class="price-row">
          <span class="price big">${money(l.price)}</span>
          <span class="cond ${Feed.condClass(l.condition)}">${l.condition}</span>
        </div>
        <h2>${l.title}</h2>
        <div class="meta">${l.location} · ${l.miles} · Listed ${l.postedAgo}</div>
        <p class="desc">${l.description}</p>
        <div class="seller">
          <div class="avatar">${l.seller[0].toUpperCase()}</div>
          <div><strong>${l.seller}</strong><div class="meta">${Icon.get('star')} ${l.sellerRating} seller rating</div></div>
        </div>
        <div class="cond-report">
          <h3>Condition Report</h3>
          ${((typeof Skills !== "undefined") && Skills.tier("gearhead") > 0) ? "" : `<div class="cond-locked-note">${Icon.get('lock')} Train <strong>Gear Head</strong> to see part conditions before buying — or buy it and inspect in your garage.</div>`}
          <div class="parts-grid">
            ${(() => {
              const parts = availableParts(l.sprite);
              const gh = (typeof Skills !== "undefined") ? Skills.tier("gearhead") : 0;
              // Which parts are revealed (seeded by listing ID so it's consistent)
              const revealed = new Set();
              if (gh >= 3) {
                parts.forEach(p => revealed.add(p.key));
              } else if (gh > 0) {
                const seed = (l.id || 0) * 9301 + 49297;
                const scored = parts.map(p => ({
                  p,
                  h: (seed * (p.key.charCodeAt(0) * 7 + p.key.length)) % 1000
                })).sort((a, b) => a.h - b.h);
                const count = gh === 1 ? 3 : Math.ceil(parts.length * 0.6);
                scored.slice(0, count).forEach(x => revealed.add(x.p.key));
              }
              return parts.map(p => {
              const st = (l.partStates && l.partStates[p.key]) || "pristine";
              const isRev = revealed.has(p.key);
              let stateLabel, pctLabel = "";
              if (!isRev) {
                stateLabel = `<span class="cond-hidden">???</span>`;
              } else {
                const pctMap = { pristine: 95, used_good: 60, used_bad: 35, totaled: 10, missing: 0 };
                const pct = pctMap[st] ?? 50;
                stateLabel = PART_STATE_LABEL[st] || st;
                pctLabel = st === "missing" ? "" : ` · ${pct}%`;
              }
              const imgSrc = (!isRev || st === "missing") ? null : partImg(l.sprite, p.key, st);
              const imgHtml = imgSrc
                ? `<img src="${imgSrc}" alt="${p.label}" loading="lazy">`
                : (isRev && st === "missing" ? `<div class="part-missing">${Icon.get('missing')}</div>` : `<div class="part-hidden">${Icon.get('hidden')}</div>`);
              return `<div class="part-cell state-${!isRev ? "hidden" : st}">
                ${imgHtml}
                <div class="part-label">${p.label}</div>
                <div class="part-state">${stateLabel}${pctLabel}</div>
              </div>`;
              }).join("");
            })()}
          </div>
        </div>
        ${this.thread && this.thread.length ? `<div class="msg-thread">` +
          this.thread.map(m => `<div class="msg ${m.from}">${m.text}</div>`).join("") + `</div>` : ""}
        ${this.notice ? `<div class="notice">${this.notice}</div>` : ""}
        <div class="msg-seller-card">
          <div class="msg-seller-head">${Icon.get('chat')} Message seller</div>
          ${((typeof Skills !== "undefined") && Skills.hasSellerHint()) ? `<div class="seller-hint">Psst — they'll probably take ${money(Math.round(l.price * 0.85))}</div>` : ""}
          <div class="msg-seller-row">
            <input id="offer-input" type="text" inputmode="numeric" pattern="[0-9]*"
              placeholder="Make an offer... ($)" autocomplete="off">
            <button id="offer-send">Send</button>
          </div>
          ${this.blocked && ((typeof Skills !== "undefined") && Skills.hasRetry() && !this.retryUsed) ? `<button class="retry-btn" id="d-retry">Smooth Talker: Give it one more shot</button>` : ""}
        </div>
        <button class="buy-btn${this.blocked ? " blocked" : ""}" id="d-buy"${this.blocked ? " disabled" : ""}>
          ${this.blocked ? `Seller blocked you` : (hr && hr.price) ? `Buy for ${money(hr.price)}` : `Buy now — ${money(l.price)}`}
        </button>
        <div class="as-is">Sold as-is. No warranties, no take-backs.</div>
      </div>
    </div>`;
    document.getElementById("d-back").onclick = () => this.close();
    document.getElementById("d-buy").onclick = () => this.buyNow();
    const offerInput = document.getElementById("offer-input");
    const sendBtn = document.getElementById("offer-send");
    const sendOffer = () => this.sendOffer(offerInput.value);
    // Numerals only as they type
    offerInput.addEventListener("input", () => {
      offerInput.value = offerInput.value.replace(/[^0-9]/g, "");
    });
    sendBtn.onclick = sendOffer;
    offerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendOffer();
    });
    // Smooth Talker Tier 2: one free retry after being blocked
    const retryBtn = document.getElementById("d-retry");
    if (retryBtn) retryBtn.onclick = () => {
      this.blocked = false;
      this.retryUsed = true;
      this.thread.push({ from: "you", text: `"Look, let's start over. No hard feelings?"` });
      this.thread.push({ from: "seller", text: `"Fine. One more chance. Don't waste it."` });
      this.render();
    };
  },
};

const UI = {
  refreshCash() {
    document.getElementById("cash").textContent = State.fmtCash();
  },
  _toastQueue: [],
  _toastShowing: false,
  _unreadActivity: 0,
  _unreadMarketplace: 0,
  _unreadBoneyard: 0,
  toast(msg, category) {
    this._toastQueue.push(msg);
    this._showNextToast();
    // Bump unread badge on bell
    this._unreadActivity++;
    this.updateBellBadge();
    // Log to activity feed (auto-detect category if not given)
    try {
      if (!category) {
        const m = msg.toLowerCase();
        category = (m.includes("part") || m.includes("boneyard")) ? "boneyard" : "marketplace";
      }
      const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
      feed.unshift({ msg, at: Date.now(), cat: category });
      if (feed.length > 50) feed.length = 50;
      localStorage.setItem("soldasis_activity", JSON.stringify(feed));
    } catch (e) {}
  },
  _activityTab: "marketplace",
  showActivity(tab) {
    // Clear unread badge
    this._unreadActivity = 0;
    this.updateBellBadge();
    // Clear tab-specific dot when that tab is opened
    const curTab = tab || this._activityTab || "marketplace";
    if (curTab === "marketplace") this._unreadMarketplace = 0;
    if (curTab === "boneyard") this._unreadBoneyard = 0;
    const popup = document.getElementById("activity-popup");
    const list = document.getElementById("activity-list");
    if (!popup || !list) return;
    if (tab) this._activityTab = tab;
    const cur = this._activityTab;
    let feed = [];
    try { feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]"); } catch (e) {}
    const filtered = feed.filter(a => (a.cat || "marketplace") === cur);
    const tabsHTML = `
      <div class="activity-tabs">
        <button class="activity-tab${cur === "marketplace" ? " active" : ""}" data-atab="marketplace">Marketplace${this._unreadMarketplace > 0 ? `<span class="tab-dot-sm"></span>` : ""}</button>
        <button class="activity-tab${cur === "boneyard" ? " active" : ""}" data-atab="boneyard">Boneyard${this._unreadBoneyard > 0 ? `<span class="tab-dot-sm"></span>` : ""}</button>
      </div>
      ${filtered.length ? `<button class="activity-clear" id="activity-clear">Clear</button>` : ""}`;
    if (!filtered.length) {
      list.innerHTML = tabsHTML + '<div class="activity-empty">No activity yet.</div>';
    } else {
      list.innerHTML = tabsHTML + filtered.map((a, idx) => {
        const d = new Date(a.at);
        const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const isClickable = a.clickable || (a.listingId && a.cat === "marketplace");
        const cls = isClickable ? "activity-item clickable" : "activity-item";
        const dataAttr = isClickable && a.listingId ? ` data-listing="${a.listingId}"` : "";
        return `<div class="${cls}"${dataAttr}><span class="activity-time">${time}</span><span>${a.msg}</span></div>`;
      }).join("");
    }
    list.querySelectorAll("[data-atab]").forEach(b => {
      b.addEventListener("click", (e) => { e.stopPropagation(); this.showActivity(b.dataset.atab); });
    });
    list.querySelectorAll(".activity-item.clickable").forEach((item, idx) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const listingId = item.dataset.listing;
        if (!listingId) return;
        // Close popup
        document.getElementById("activity-popup")?.classList.add("hidden");
        // Check if this was a sold (buy-it-now) notification
        let feed = [];
        try { feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]"); } catch (err) {}
        const cur = this._activityTab || "marketplace";
        const filtered = feed.filter(a => (a.cat || "marketplace") === cur);
        const entry = filtered[idx];
        if (typeof Views !== "undefined") {
          if (entry && entry.soldView && Views.openSoldFromActivity) {
            Views.openSoldFromActivity(listingId);
          } else if (Views.openOfferFromActivity) {
            Views.openOfferFromActivity(listingId);
          }
        }
      });
    });
    const clearBtn = list.querySelector("#activity-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        try { localStorage.setItem("soldasis_activity", "[]"); } catch (err) {}
        this._unreadActivity = 0;
        this.updateBellBadge();
        this.showActivity();
      });
    }
    // Close other popups
    document.getElementById("music-popup")?.classList.add("hidden");
    document.getElementById("settings-menu")?.classList.add("hidden");
    // Only toggle when opening from bell (no tab arg); tab switches keep it open
    if (!tab) {
      popup.classList.toggle("hidden");
    } else {
      popup.classList.remove("hidden");
    }
  },
  updateBellBadge() {
    const bell = document.getElementById("activity-bell");
    if (!bell) return;
    let dot = bell.querySelector(".bell-dot");
    if (this._unreadActivity > 0) {
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "bell-dot";
        bell.appendChild(dot);
      }
    } else if (dot) {
      dot.remove();
    }
  },
  _showNextToast() {
    if (this._toastShowing || !this._toastQueue.length) return;
    this._toastShowing = true;
    const msg = this._toastQueue.shift();
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => {
        t.remove();
        this._toastShowing = false;
        this._showNextToast();
      }, 300);
    }, 2500);
  },
};
