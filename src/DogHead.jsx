import { useId } from "react";

export default function DogHead({ size = 108, animated = true }) {
  const instanceId = useId().replace(/:/g, "");
  const ids = {
    forehead: `dog-gForehead-${instanceId}`,
    ear: `dog-gEar-${instanceId}`,
    muzzle: `dog-gMuzzle-${instanceId}`,
    peach: `dog-gPeach-${instanceId}`,
    iris: `dog-gIris-${instanceId}`,
    eyeLeft: `dog-clipE1-${instanceId}`,
    eyeRight: `dog-clipE2-${instanceId}`,
  };

  return (
    <span className={`dog-root${animated ? " dog-anim" : ""}`} style={{ width: size }}>
      <svg viewBox="150 0 660 853" width="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" strokeLinejoin="round" strokeLinecap="round">
        <g className="dog-all">
          <defs>
            <radialGradient id={ids.forehead} cx="58%" cy="30%" r="70%"><stop offset="0" stopColor="#f9ad48" /><stop offset="1" stopColor="#ee8a2b" /></radialGradient>
            <linearGradient id={ids.ear} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f19a84" /><stop offset="1" stopColor="#e3735f" /></linearGradient>
            <linearGradient id={ids.muzzle} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#4d3f3c" /><stop offset="1" stopColor="#32282a" /></linearGradient>
            <linearGradient id={ids.peach} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fcc999" /><stop offset="1" stopColor="#f7b684" /></linearGradient>
            <radialGradient id={ids.iris} cx="68%" cy="62%" r="70%"><stop offset="0" stopColor="#3b2418" /><stop offset="0.5" stopColor="#1b1210" /><stop offset="1" stopColor="#120c0b" /></radialGradient>
            <clipPath id={ids.eyeLeft}><path d="M438 394 Q458 344 514 339 Q564 346 563 394 Q548 442 504 442 Q458 440 438 394 Z" /></clipPath>
            <clipPath id={ids.eyeRight}><path d="M634 362 Q648 334 676 337 Q704 346 700 394 Q692 428 664 428 Q634 414 634 362 Z" /></clipPath>
          </defs>
          <path d="M330 18 Q292 40 282 100 Q270 200 272 296 L300 326 L266 346 L296 372 L252 412 L284 432 L246 466 L272 486 L224 538 L264 556 L218 600 L254 628 L228 668 L264 696 L252 732 L302 760 L380 782 L450 812 L482 832 L522 802 L600 782 L722 702 L692 682 L640 642 L652 620 L702 562 L742 522 L756 480 L736 440 L724 380 L754 300 L750 230 Q746 110 718 28 Q704 6 688 26 Q630 110 562 172 L522 150 L502 192 Q442 92 346 26 Q336 14 330 18 Z" fill="#2c211e" stroke="#0e0908" strokeWidth="16" />
          <g fill="none" stroke="#43332e" strokeWidth="5" opacity=".8">
            <path d="M300 400 Q320 440 300 480" /><path d="M290 540 Q320 570 300 610" /><path d="M300 660 Q330 690 320 730" /><path d="M310 260 Q330 300 320 330" /><path d="M600 660 Q640 670 670 690" />
          </g>
          <g>
            <path d="M340 62 Q310 140 324 236 Q334 280 362 302 L376 270 L414 244 L396 206 L428 184 L404 166 L386 168 Q362 112 340 62 Z" fill={`url(#${ids.ear})`} />
            <path d="M346 100 Q330 170 340 240" fill="none" stroke="#f6b5a0" strokeWidth="6" opacity=".6" />
            <path d="M702 58 Q662 130 646 214 L668 226 L702 262 Q726 202 728 140 Q718 90 702 58 Z" fill={`url(#${ids.ear})`} />
            <path d="M700 90 Q676 150 668 200" fill="none" stroke="#f6b5a0" strokeWidth="5" opacity=".6" />
          </g>
          <path d="M473 198 L494 219 L522 226 L538 210 L566 196 L574 222 L600 218 L626 232 L652 240 L686 282 L708 324 L718 362 L720 424 L700 452 L640 474 L560 446 L470 444 L400 474 L346 498 L292 508 L322 470 L352 446 L350 418 L384 400 L360 388 L408 358 L400 336 L440 320 L436 292 L458 280 L446 264 L476 240 Z" fill={`url(#${ids.forehead})`} stroke="#0e0908" strokeWidth="6" />
          <path d="M462 330 Q500 300 566 312 Q540 330 500 336 Z" fill="#c8701f" opacity=".55" /><path d="M636 326 Q662 310 696 330 Q676 338 650 342 Z" fill="#c8701f" opacity=".55" />
          <path d="M520 240 Q540 260 535 300 M590 240 Q610 270 600 310" fill="none" stroke="#fbbd5c" strokeWidth="5" opacity=".6" />
          <path d="M347 500 Q372 440 410 410 Q450 396 494 424 L504 436 L470 496 L500 546 L560 574 L650 590 L610 612 L596 626 L590 646 L568 676 L560 692 L536 722 L522 772 L482 818 L458 776 L450 748 L416 730 L418 708 L384 668 L398 650 L372 622 L392 592 L352 584 L398 526 Z" fill={`url(#${ids.peach})`} stroke="#0e0908" strokeWidth="6" />
          <g fill="none" stroke="#eaa072" strokeWidth="5" opacity=".9"><path d="M470 640 Q476 690 470 735" /><path d="M520 650 Q510 700 496 748" /><path d="M430 600 Q445 640 440 680" /><path d="M556 640 Q548 680 540 700" /></g>
          <path d="M299 629 L333 666 L400 690 L440 760 L400 778 L320 766 L279 734 L309 712 L272 676 L330 670 Z" fill="#ef8d2d" stroke="#0e0908" strokeWidth="6" />
          <path d="M540 792 L560 742 L628 668 L612 702 L700 692 L722 700 L672 732 L610 772 Z" fill="#ef8d2d" stroke="#0e0908" strokeWidth="6" />
          <path d="M504 502 Q508 454 562 438 Q620 426 672 430 Q722 436 744 466 Q756 494 736 522 Q700 562 640 574 Q580 586 534 562 Q504 540 502 500 Z" fill={`url(#${ids.muzzle})`} stroke="#0e0908" strokeWidth="7" />
          <path d="M536 462 Q582 444 650 446" fill="none" stroke="#6a5a55" strokeWidth="6" opacity=".5" />
          <path d="M474 494 Q490 552 566 578 Q632 594 692 562 Q724 542 738 516" fill="none" stroke="#0e0908" strokeWidth="12" />
          <path d="M470 482 Q488 470 506 490 Q500 516 480 516 Q466 504 470 482 Z" fill="#0e0908" />
          <path d="M508 584 Q580 610 656 588" fill="none" stroke="#ee9a62" strokeWidth="6" opacity=".9" />
          <ellipse cx="712" cy="480" rx="48" ry="37" transform="rotate(-14 712 480)" fill="#0c0807" />
          <ellipse className="dog-shine" cx="708" cy="462" rx="23" ry="6" transform="rotate(-8 708 462)" fill="#fff" opacity=".95" />
          <path d="M456 340 Q468 292 516 282 Q552 280 570 298 Q568 308 560 308 Q522 296 494 318 Q476 332 456 340 Z" fill="#0e0908" />
          <path d="M632 312 Q646 288 674 282 Q694 284 702 304 Q690 300 674 304 Q654 310 644 322 Z" fill="#0e0908" />
          <g className="dog-blink">
            <path d="M438 394 Q458 344 514 339 Q564 346 563 394 Q548 442 504 442 Q458 440 438 394 Z" fill="#fff" />
            <g clipPath={`url(#${ids.eyeLeft})`}><g className="dog-pupil"><circle cx="478" cy="398" r="45" fill={`url(#${ids.iris})`} /><circle cx="460" cy="378" r="9" fill="#fff" /><circle cx="486" cy="378" r="4" fill="#b8714a" /></g><path d="M430 330 Q510 322 570 350 L570 372 Q510 340 440 372 Z" fill="#0e0908" opacity=".25" /></g>
            <path d="M438 394 Q458 344 514 339 Q564 346 563 394 Q548 442 504 442 Q458 440 438 394 Z" fill="none" stroke="#0e0908" strokeWidth="9" /><path d="M434 404 Q452 336 520 334 Q570 340 568 392" fill="none" stroke="#0e0908" strokeWidth="15" />
          </g>
          <g className="dog-blink">
            <path d="M634 362 Q648 334 676 337 Q704 346 700 394 Q692 428 664 428 Q634 414 634 362 Z" fill="#fff" />
            <g clipPath={`url(#${ids.eyeRight})`}><g className="dog-pupil"><circle cx="656" cy="382" r="25" fill={`url(#${ids.iris})`} /><circle cx="648" cy="366" r="6" fill="#fff" /><circle cx="664" cy="368" r="3" fill="#d9915a" /></g></g>
            <path d="M634 362 Q648 334 676 337 Q704 346 700 394 Q692 428 664 428 Q634 414 634 362 Z" fill="none" stroke="#0e0908" strokeWidth="8" /><path d="M630 372 Q644 330 680 332 Q708 340 704 390" fill="none" stroke="#0e0908" strokeWidth="12" />
          </g>
        </g>
      </svg>
    </span>
  );
}
