// ─── FALLBACK DEVOTIONAL CONTENT ───────────────────────────────────────────
// Used by /api/v1/daily ONLY when live Claude generation is unavailable
// (no ANTHROPIC_API_KEY configured, or the API call fails) -- see
// src/app/api/v1/daily/route.ts. Deliberately verse-agnostic (the actual
// Scripture text always comes from the real Bible API, chosen separately
// from FALLBACK_REFS) so any of these can pair with any of that list's 155
// real references without reading oddly.
//
// Real fix: this used to be a single hardcoded reflection/prayer/challenge/
// question, byte-identical every single day regardless of date. This pool
// of 30 distinct, independently-written entries is selected by a date-
// seeded hash (see pickFallbackContent), so even with no AI key configured
// the app still shows genuinely varied, professionally-written content --
// not the same three sentences forever.

export type FallbackContent = {
  title: string
  reflection: string
  prayer: string
  challenge: string
  reflectionQuestion: string
}

export const FALLBACK_CONTENT: FallbackContent[] = [
  {
    title: 'New Mercies',
    reflection: 'Every morning God’s mercy arrives before you do -- untouched by yesterday’s failures or fears. You don’t have to earn today’s fresh start; it’s already been given. Set down whatever you’ve been carrying from yesterday and let this day be received, not just survived.',
    prayer: 'Father, thank You that Your mercy meets me new every morning. I release what I’ve been carrying from yesterday and receive this day as a gift from Your hand. Teach me to walk in it with a light and grateful heart. Amen.',
    challenge: 'Name one thing from yesterday you’re still carrying, and consciously set it down before you start your day.',
    reflectionQuestion: 'What would change today if you truly believed you were starting with a clean slate?',
  },
  {
    title: 'Steady in the Storm',
    reflection: 'Storms don’t ask permission before they arrive, but neither does God’s presence leave when they do. Faith isn’t the absence of wind and waves -- it’s knowing who is in the boat with you. Whatever is shaking today, it isn’t bigger than the One who holds you steady through it.',
    prayer: 'Lord, when everything around me feels unstable, be my steady ground. Calm what needs calming, and where You don’t remove the storm, give me peace to stand in the middle of it with You. Amen.',
    challenge: 'Write down the one worry that’s loudest today, and hand it to God in a single honest sentence.',
    reflectionQuestion: 'Where in your life right now do you need to trust God’s presence more than you need the storm to stop?',
  },
  {
    title: 'Quiet Trust',
    reflection: 'Not every act of faith is loud. Sometimes trust looks like simply not panicking -- choosing to keep showing up, keep being kind, keep doing the next right thing, even when you can’t see how it all resolves. God isn’t asking for certainty about the outcome, only faithfulness in the meantime.',
    prayer: 'Lord, grow in me a trust that doesn’t need to see the whole path to keep walking. Steady my heart in the waiting, and help me be faithful right where I am today. Amen.',
    challenge: 'Do the next right thing in front of you today without demanding to know how the bigger picture resolves.',
    reflectionQuestion: 'What is one area where God is asking you to trust Him without full information?',
  },
  {
    title: 'Called by Name',
    reflection: 'You are not anonymous to God -- not a face in a crowd, not a statistic, not an afterthought. He knows your name, your story, and exactly where you are today. Being truly known can feel exposing, but it’s also where real love begins: He sees all of you and still calls you His.',
    prayer: 'Father, thank You that I am fully known and still fully loved by You. Help me stop hiding the parts of myself I’m ashamed of, and let me live today from the security of being Yours. Amen.',
    challenge: 'Spend two quiet minutes today simply letting the truth "I am known and loved by God" sink in.',
    reflectionQuestion: 'What part of yourself do you find hardest to believe God truly sees and still loves?',
  },
  {
    title: 'Grace for the Journey',
    reflection: 'You don’t need enough grace for the whole year, or even the whole week -- just enough for today, and God has already supplied that. Growth is rarely a straight line; it’s two steps forward, one step back, and grace covering the gap every time. Be patient with your own becoming.',
    prayer: 'Lord, thank You for meeting me exactly where I am today, not where I think I should already be. Give me grace for my own process, and help me extend that same patience to others. Amen.',
    challenge: 'Offer yourself the same grace today that you’d offer a friend who was struggling with the same thing.',
    reflectionQuestion: 'Where have you been harder on yourself than God actually is?',
  },
  {
    title: 'Anchored Hope',
    reflection: 'Hope in God isn’t wishful thinking -- it’s an anchor that holds even when circumstances are still uncertain. You can feel the wind and still not be swept away, because what you’re tethered to doesn’t move. Whatever is unresolved today, your hope doesn’t depend on the answer coming right now.',
    prayer: 'God, be the anchor for my hope today. When circumstances shift and I feel unsettled, remind me that You do not change, and that my hope is safe in You regardless of the outcome. Amen.',
    challenge: 'Identify one uncertain situation and consciously choose to anchor your peace in God rather than the outcome.',
    reflectionQuestion: 'What are you currently hoping in that isn’t God -- and what would it look like to re-anchor there?',
  },
  {
    title: 'Room for Rest',
    reflection: 'Rest isn’t a reward you earn after everything is finished -- it’s a rhythm God built into life from the beginning. Pushing through exhaustion isn’t always faithfulness; sometimes it’s pride refusing to admit limits. You’re allowed to stop today. The world, and God’s plans, will hold without you carrying them alone.',
    prayer: 'Lord, forgive me for treating busyness as a badge of honor. Teach me to rest without guilt, trusting that You are still at work even when I stop. Restore what’s been depleted in me. Amen.',
    challenge: 'Build one deliberate, unhurried pause into today -- no phone, no task list, just stillness.',
    reflectionQuestion: 'What is it costing you to keep refusing rest?',
  },
  {
    title: 'Courage to Begin',
    reflection: 'Most breakthroughs don’t start with confidence -- they start with a shaky first step taken anyway. Courage isn’t the absence of fear; it’s moving forward with God even while the fear is still there. Whatever you’ve been putting off because it feels too big, today only asks for the first honest step.',
    prayer: 'Father, give me courage to begin what I’ve been avoiding. I don’t need to see the whole path -- just enough light for the next step, and Your strength to take it. Amen.',
    challenge: 'Take one small, concrete step today toward something you’ve been putting off out of fear.',
    reflectionQuestion: 'What is fear currently costing you that courage could reclaim?',
  },
  {
    title: 'Held in Love',
    reflection: 'Underneath every circumstance, good or hard, is a love that doesn’t waver with your performance. You are not more loved on your best days or less loved on your worst ones. Let that truth settle deeper today than your to-do list, your mistakes, or your accomplishments ever could.',
    prayer: 'Father, remind me today that Your love for me isn’t a reaction to my performance. Help me rest in being held, not because I’ve earned it, but because that’s simply who You are. Amen.',
    challenge: 'Notice one moment today when you’re tempted to measure your worth by performance, and choose to rest in being loved instead.',
    reflectionQuestion: 'Do you believe God’s love for you changes based on how well today goes? Why or why not?',
  },
  {
    title: 'Wisdom for the Way',
    reflection: 'You don’t have to figure everything out alone. Wisdom isn’t knowing every answer in advance -- it’s staying close enough to God to hear the next instruction when you need it. Ask honestly, listen patiently, and trust that direction will come in time for the step in front of you.',
    prayer: 'Lord, I don’t need to see ten steps ahead -- just wisdom for the one in front of me. Quiet my anxious planning, and help me listen for Your voice before I lean on my own understanding. Amen.',
    challenge: 'Before making today’s next decision, pause and ask God for wisdom instead of defaulting to instinct alone.',
    reflectionQuestion: 'Where have you been trying to solve something on your own that you haven’t actually brought to God yet?',
  },
  {
    title: 'A Grateful Heart',
    reflection: 'Gratitude doesn’t deny that things are hard -- it simply refuses to let hardship have the only voice. Even in a difficult season, there is usually something small worth naming: a kindness, a provision, a breath you didn’t have to fight for. Gratitude trains the heart to notice what grace has already provided.',
    prayer: 'Lord, open my eyes to what I’ve overlooked. Even in what’s difficult, help me find something true to be thankful for, and let gratitude shape how I move through today. Amen.',
    challenge: 'Name three specific things you’re grateful for today, even if the day itself feels heavy.',
    reflectionQuestion: 'What good thing have you been overlooking because you’re focused on what’s hard?',
  },
  {
    title: 'Freedom in Forgiveness',
    reflection: 'Unforgiveness feels like protection, but it usually costs the one holding onto it the most. Forgiving someone doesn’t mean pretending it didn’t hurt or that it’s suddenly fine -- it means releasing your grip on it so it stops shaping you. That release is often slow, and God is patient with the process.',
    prayer: 'Father, You know exactly who and what I’m still holding onto. Help me begin the process of releasing it, not because it was okay, but because I don’t want it to keep shaping my heart. Amen.',
    challenge: 'Bring one specific person or hurt to God honestly today, even if you’re not ready to fully let it go yet.',
    reflectionQuestion: 'What is unforgiveness currently costing you that you haven’t named out loud?',
  },
  {
    title: 'Strength in Weakness',
    reflection: 'You don’t have to hide the places where you feel weak or depleted -- that’s often exactly where God’s strength shows up most clearly. Trying to appear fine when you’re not just delays the moment you actually let help in. Weakness admitted honestly is not failure; it’s the doorway grace walks through.',
    prayer: 'Lord, I don’t have to pretend to be strong today. In the places I feel weak or depleted, meet me there. Let Your strength be made visible exactly where mine runs out. Amen.',
    challenge: 'Be honest with one person today about a place you’re struggling, instead of managing appearances.',
    reflectionQuestion: 'What are you currently pretending is fine that actually isn’t?',
  },
  {
    title: 'Walking in the Light',
    reflection: 'Living honestly -- with God and with others -- takes real courage, but it’s also where genuine peace is found. Hidden things grow heavier the longer they stay hidden. Walking in the light doesn’t mean having nothing left to work on; it means refusing to pretend you don’t.',
    prayer: 'Lord, search my heart today and show me anything I’ve been keeping in the dark. Give me courage to bring it into the light, trusting Your grace more than I fear being known. Amen.',
    challenge: 'Identify one thing you’ve been hiding, and take one honest step toward bringing it into the light.',
    reflectionQuestion: 'What would change in your life if you stopped managing your image and simply told the truth?',
  },
  {
    title: 'Faithful in Small Things',
    reflection: 'Most of life happens in unremarkable moments -- the ordinary conversation, the small kindness, the quiet decision no one applauds. Faithfulness isn’t usually forged in dramatic moments; it’s built in a thousand small, unseen ones. God notices what the world overlooks, and He is building something in the small things too.',
    prayer: 'Father, help me stop waiting for a big moment to be faithful. Let me honor You in the small, unseen choices of today, trusting that nothing done for You is ever wasted. Amen.',
    challenge: 'Do one small, unnoticed act of faithfulness today -- something no one will praise you for.',
    reflectionQuestion: 'What small, ordinary act of faithfulness has God set in front of you today?',
  },
  {
    title: 'Peace Beyond Understanding',
    reflection: 'Peace that depends on everything making sense is a fragile kind of peace. But there’s a deeper kind available -- one that holds steady even when the circumstances haven’t resolved and the questions haven’t been answered. That peace doesn’t come from having it all figured out; it comes from staying close to the One who does.',
    prayer: 'Lord, guard my heart and mind today with a peace I can’t manufacture on my own. Where I don’t have answers, give me enough peace to keep trusting You anyway. Amen.',
    challenge: 'When anxious thoughts rise today, pause and consciously hand the unresolved question back to God.',
    reflectionQuestion: 'What unresolved question is stealing your peace right now, and what would it look like to trust God with it instead of solving it?',
  },
  {
    title: 'A Heart That Listens',
    reflection: 'It’s easy to fill every quiet moment with noise -- and easy to miss what God might be saying in the silence because of it. Listening takes intention: slowing down enough to actually hear, instead of just waiting for your turn to talk or move on to the next thing.',
    prayer: 'Lord, quiet the noise in and around me today. Give me a heart that actually listens -- to You, and to the people You’ve placed in my life. Slow me down enough to hear. Amen.',
    challenge: 'Spend five unhurried minutes today in silence, simply listening instead of asking or planning.',
    reflectionQuestion: 'When was the last time you were truly quiet long enough to listen for God’s voice?',
  },
  {
    title: 'Planted and Growing',
    reflection: 'Growth is rarely visible day to day -- it happens underground, quietly, before anything breaks the surface. If today feels like nothing is changing, that doesn’t mean nothing is happening. Stay planted. Roots that go deep in a season of quiet are what hold steady when the wind eventually comes.',
    prayer: 'Lord, when I can’t see growth happening, help me trust that You are still at work beneath the surface. Keep me planted and patient, even in seasons that feel uneventful. Amen.',
    challenge: 'Do one thing today that nurtures your roots -- Scripture, prayer, honest conversation -- even if you don’t feel like it.',
    reflectionQuestion: 'What would it look like to trust growth you can’t yet see?',
  },
  {
    title: 'Joy in the Waiting',
    reflection: 'Waiting seasons can feel like wasted time, but they’re rarely empty. Something is usually being formed in you while you wait -- patience, trust, character -- that couldn’t be formed any other way. Joy doesn’t have to wait for the waiting to end; it can exist in the middle of it too.',
    prayer: 'Father, teach me to find joy even while I wait. Help me trust that this season isn’t wasted time, and that You are shaping something in me that I’ll be glad for later. Amen.',
    challenge: 'Name one thing you’re currently waiting on, and thank God for one specific thing this waiting season has taught you.',
    reflectionQuestion: 'What is God possibly forming in you during this season of waiting?',
  },
  {
    title: 'Living Generously',
    reflection: 'Generosity isn’t only about money -- it’s a posture of open hands with your time, attention, and grace toward others. A generous life tends to be a freer one, less gripped by scarcity and more anchored in trust that God provides. What you hold loosely today, He can use.',
    prayer: 'Lord, loosen my grip on what I’ve been holding tightly -- whether it’s money, time, or grace toward others. Make me generous, trusting that You are the One who truly provides. Amen.',
    challenge: 'Give something away today -- your time, attention, or resources -- without expecting anything in return.',
    reflectionQuestion: 'What are you holding onto too tightly that God might be asking you to release generously?',
  },
  {
    title: 'Renewed Purpose',
    reflection: 'It’s easy to lose sight of why you’re doing what you’re doing when the routine sets in. But your ordinary days are not disconnected from God’s bigger purpose for your life -- they’re the actual material it’s built from. Today matters more than it may feel like right now.',
    prayer: 'Father, renew my sense of purpose today. Help me see that this ordinary day is not disconnected from Your larger plan for my life, and help me live it with intention. Amen.',
    challenge: 'Reconnect one routine task today to a larger purpose -- do it with intention instead of autopilot.',
    reflectionQuestion: 'Where have you started going through the motions without remembering why it matters?',
  },
  {
    title: 'Unshaken Identity',
    reflection: 'Who you are isn’t determined by today’s wins, losses, opinions, or comparisons. Those things shift constantly, but your identity in Christ doesn’t rise and fall with them. When you’re tempted to measure yourself against everyone else today, remember: you were never meant to be anyone but exactly who God made you.',
    prayer: 'Lord, remind me today that my identity is secure in You, not in comparison, performance, or other people’s opinions. Anchor my sense of self in who You say I am. Amen.',
    challenge: 'Notice one moment of comparison today, and consciously replace it with a truth about who you are in Christ.',
    reflectionQuestion: 'Whose opinion of you have you been treating as more important than God’s?',
  },
  {
    title: 'Prayer as a Lifeline',
    reflection: 'Prayer isn’t a formality to get through before the real work of the day begins -- it’s the lifeline that sustains everything else. You don’t need polished words. Honest, unfinished, even messy prayer still reaches God. Bring today to Him as it actually is, not as you wish it looked.',
    prayer: 'Lord, teach me to bring You my day honestly, not just the parts that sound good in prayer. Meet me in the mess and the uncertainty, not only in the moments I have it together. Amen.',
    challenge: 'Pray one honest, unedited sentence to God today about exactly how you’re actually doing.',
    reflectionQuestion: 'What have you been avoiding bringing to God in prayer because it feels too messy or unresolved?',
  },
  {
    title: 'Obedience One Step at a Time',
    reflection: 'God rarely reveals the whole map at once -- usually just the next step. Obedience isn’t about having full clarity before you move; it’s about trusting the One giving the instruction enough to take the step you do have, and trusting Him for the ones you don’t yet see.',
    prayer: 'Father, I don’t need to see the whole plan today -- just the willingness to obey the part You’ve already made clear. Give me courage to take the next step, even without full clarity. Amen.',
    challenge: 'Identify one thing you already know God is asking of you, and do it today without waiting for more clarity.',
    reflectionQuestion: 'What is the "next step" you’ve already been shown but haven’t taken yet?',
  },
  {
    title: 'Comfort for the Weary',
    reflection: 'If you’re running on empty today, that’s not a disqualification -- it’s an invitation. God doesn’t ask the weary to perform their way back to strength; He offers rest first. There’s no need to wait until you feel put-together to come to Him. Come tired. Come exactly as you are.',
    prayer: 'Lord, I’m tired, and I don’t need to pretend otherwise with You. Meet me in my weariness, restore what’s been worn down, and give me rest that actually reaches my soul. Amen.',
    challenge: 'Give yourself permission today to rest before you feel like you’ve earned it.',
    reflectionQuestion: 'What would it look like to bring your exhaustion honestly to God instead of pushing through it alone?',
  },
  {
    title: 'A Humble Spirit',
    reflection: 'Humility isn’t thinking less of yourself -- it’s thinking of yourself less often, and making room for others and for God in the space that leaves. A humble heart can receive correction without collapsing and offer grace without needing credit. It’s a quieter kind of strength than the world usually celebrates.',
    prayer: 'Lord, teach me humility that isn’t self-deprecating but genuinely others-focused. Help me hold my opinions, achievements, and need to be right a little more loosely today. Amen.',
    challenge: 'Let someone else be right today, or take credit, without needing to correct the record.',
    reflectionQuestion: 'Where has pride been making a situation harder than it needs to be?',
  },
  {
    title: 'Standing Firm',
    reflection: 'Some days call less for movement and more for simply staying put -- holding your ground in what you know to be true when pressure pushes you to compromise it. Standing firm isn’t stubbornness; it’s conviction that has counted the cost and decided it’s worth staying rooted for.',
    prayer: 'Lord, give me conviction that doesn’t bend under pressure. Where I’m tempted to compromise what I know is right, help me stand firm, rooted in You rather than in what’s easiest. Amen.',
    challenge: 'Identify one place you’ve been tempted to compromise, and choose to stand firm in it today.',
    reflectionQuestion: 'Where is pressure currently pushing you to bend on something you actually believe?',
  },
  {
    title: 'The Gift of Today',
    reflection: 'Yesterday is finished and tomorrow isn’t promised, which makes today the only place you can actually live, choose, and love well. It’s tempting to live mentally somewhere else -- rehearsing the past or rehearsing the future -- but this day, exactly as it is, is the one God has actually given you.',
    prayer: 'Father, help me be fully present in this day instead of living in yesterday’s regret or tomorrow’s anxiety. Thank You for the gift of today. Teach me to receive it well. Amen.',
    challenge: 'Choose one moment today to be fully present -- put away distractions and actually be where you are.',
    reflectionQuestion: 'How much of today have you already spent mentally somewhere other than where you actually are?',
  },
  {
    title: 'Restored and Made New',
    reflection: 'Whatever feels broken today -- a relationship, a plan, a part of yourself -- restoration is still within God’s reach. He specializes in redeeming what looks past saving and making something new out of what felt finished. Nothing you bring Him honestly is wasted, even the pieces that feel beyond repair.',
    prayer: 'Lord, I bring You what feels broken today and trust You with it. You are the God who restores and makes new -- do that work in me and in what I’ve brought before You. Amen.',
    challenge: 'Name one broken thing you’ve stopped bringing to God because it felt too far gone, and bring it to Him again today.',
    reflectionQuestion: 'What have you quietly given up hope of God restoring?',
  },
  {
    title: 'Worship in the Ordinary',
    reflection: 'Worship isn’t confined to a song or a Sunday -- it can shape an ordinary Tuesday just as much. Doing your work with integrity, treating people with kindness, being grateful in the mundane -- all of it can be an act of worship when it’s offered to God rather than just gotten through.',
    prayer: 'Lord, let today’s ordinary moments become an offering to You. Whatever I do -- work, rest, conversation -- let it be shaped by gratitude and done as if for You. Amen.',
    challenge: 'Do one ordinary task today with the intentional posture of offering it to God, not just getting through it.',
    reflectionQuestion: 'What would change if you treated today’s ordinary tasks as worship rather than obligation?',
  },
]
