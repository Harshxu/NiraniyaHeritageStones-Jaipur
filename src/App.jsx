import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import lottie from 'lottie-web'
import BlurText from './BlurText'
import ScrollFloat from './ScrollFloat'
import ScrollStack, { ScrollStackItem } from './ScrollStack'
import Silk from './components/Silk'
import './App.css'

const DEVOTIONAL_TRACK_SRC = '/devotional-track.mp3'
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
const INQUIRY_API_URL = API_BASE_URL ? `${API_BASE_URL}/api/inquiries` : '/api/inquiries'
const OWNER_EMAIL = String(import.meta.env.VITE_OWNER_EMAIL || 'harshkumawat9950@gmail.com').trim()
const FORM_SUBMIT_FALLBACK_URL = `https://formsubmit.co/ajax/${encodeURIComponent(OWNER_EMAIL)}`

const products = [
  {
    id: 'g1',
    name: 'Sri Ganesh Blessing Murti',
    category: 'Ganesh Idol',
    stone: 'Makrana Marble',
    size: '24 inch',
    price: 54000,
    image:
      'https://images.pexels.com/photos/33787258/pexels-photo-33787258.jpeg?auto=compress&cs=tinysrgb&w=1200',
    story:
      'Carved from milk-white marble, this Ganesh murti is inspired by dawn rituals in old Jaipur havelis. Families place this form at the entrance to invite wisdom before every new beginning.',
  },
  {
    id: 's1',
    name: 'Meditative Shiva Shila',
    category: 'Shiva Idol',
    stone: 'Black Granite',
    size: '30 inch',
    price: 76000,
    image:
      'https://images.pexels.com/photos/16553358/pexels-photo-16553358.jpeg?auto=compress&cs=tinysrgb&w=1200',
    story:
      'Sculpted in a still meditative posture, this Shiva piece reflects the silence of Himalayan caves. It is made for prayer spaces where calm, focus, and inner steadiness are desired daily.',
  },
  {
    id: 'b1',
    name: 'Karuna Buddha Idol',
    category: 'Buddha Idol',
    stone: 'Sandstone',
    size: '28 inch',
    price: 62000,
    image:
      'https://images.pexels.com/photos/17316715/pexels-photo-17316715.jpeg?auto=compress&cs=tinysrgb&w=1200',
    story:
      'The soft sandstone finish mirrors temple courtyards after rain. Artists shape the gentle smile to remind the home that strength and compassion can exist together in every decision.',
  },
  {
    id: 'v1',
    name: 'Lakshmi Prosperity Form',
    category: 'Lakshmi Idol',
    stone: 'Pink Stone',
    size: '22 inch',
    price: 48000,
    image:
      'https://images.pexels.com/photos/15902669/pexels-photo-15902669.jpeg?auto=compress&cs=tinysrgb&w=1200',
    story:
      'This Lakshmi form follows a classic Rajasthani layout where lotus petals frame the base. It is crafted as a prosperity anchor for festive spaces and new ventures.',
  },
  {
    id: 'h1',
    name: 'Hanuman Veer Stambh',
    category: 'Hanuman Idol',
    stone: 'Brown Stone',
    size: '34 inch',
    price: 81000,
    image:
      'https://images.pexels.com/photos/11727521/pexels-photo-11727521.jpeg?auto=compress&cs=tinysrgb&w=1200',
    story:
      'Inspired by the warrior-protector tradition, this Hanuman murti is hand-finished to highlight strength in movement. Many families install it for courage and discipline in daily life.',
  },
  {
    id: 'n1',
    name: 'Nandi Guardian Sculpture',
    category: 'Nandi Idol',
    stone: 'Grey Granite',
    size: '20 inch',
    price: 39000,
    image:
      'https://images.pexels.com/photos/35509112/pexels-photo-35509112.jpeg?auto=compress&cs=tinysrgb&w=1200',
    story:
      'Every curve of this Nandi is chiseled to represent loyalty, patience, and devotion. It is ideal for courtyards and mandir entrances where it can stand as a timeless guardian.',
  },
]

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const initialCustomer = {
  name: '',
  phone: '',
  city: '',
  notes: '',
}

const ownerContactNumber = '+91 93513 03138'
const ownerContactTel = '+919351303138'
const INTRO_TOTAL_MS = 2600
const INTRO_BLUR_FADE_MS = 700
const INTRO_VISIBLE_MS = INTRO_TOTAL_MS - INTRO_BLUR_FADE_MS
const HERO_TITLE_START_DELAY_MS = INTRO_VISIBLE_MS + INTRO_BLUR_FADE_MS + 120
const HERO_TITLE_TEXT = 'Every Idol Carries a Story, Not Just a Price'
const scrollFloatProps = {
  animationDuration: 1,
  ease: 'back.inOut(2)',
  scrollStart: 'center bottom+=50%',
  scrollEnd: 'bottom bottom-=40%',
  stagger: 0.03,
}

function createInquiryMessage(customer, cartItems, subtotal) {
  const lines = cartItems.map(
    (item) => `- ${item.name} x${item.quantity} (${inr.format(item.lineTotal)})`,
  )

  return [
    'Namaste, I would like to inquire about these Niraniya Heritage Stones items:',
    '',
    ...lines,
    '',
    `Estimated Total: ${inr.format(subtotal)}`,
    '',
    'Customer Details:',
    `Name: ${customer.name || 'Not provided'}`,
    `Phone: ${customer.phone || 'Not provided'}`,
    `City: ${customer.city || 'Not provided'}`,
    `Notes: ${customer.notes || 'No additional notes'}`,
  ].join('\n')
}

function App() {
  const [cart, setCart] = useState({})
  const [customer, setCustomer] = useState(initialCustomer)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isIntroVisible, setIsIntroVisible] = useState(true)
  const [isIntroExiting, setIsIntroExiting] = useState(false)
  const [recentlyAddedMap, setRecentlyAddedMap] = useState({})
  const [isSendingInquiry, setIsSendingInquiry] = useState(false)
  const [statusPopup, setStatusPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    isSuccess: true,
  })
  const audioElementRef = useRef(null)
  const soundToggleLottieRef = useRef(null)
  const soundToggleLottieInstanceRef = useRef(null)
  const addButtonTimeoutsRef = useRef({})

  useEffect(() => {
    const startExitId = window.setTimeout(() => {
      setIsIntroExiting(true)
    }, INTRO_VISIBLE_MS)

    const hideIntroId = window.setTimeout(() => {
      setIsIntroVisible(false)
    }, INTRO_VISIBLE_MS + INTRO_BLUR_FADE_MS)

    return () => {
      window.clearTimeout(startExitId)
      window.clearTimeout(hideIntroId)
    }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(addButtonTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      addButtonTimeoutsRef.current = {}
    }
  }, [])

  useEffect(() => {
    // Defensive cleanup: if an old deployment injected Tawk, remove it and silence widget sounds.
    const tawkScripts = document.querySelectorAll('script[src*="embed.tawk.to"]')
    const tawkIframes = document.querySelectorAll('iframe[src*="tawk.to"]')
    const tawkContainers = document.querySelectorAll('[id*="tawk"], [class*="tawk"]')

    tawkScripts.forEach((node) => node.remove())
    tawkIframes.forEach((node) => node.remove())
    tawkContainers.forEach((node) => node.remove())

    if (window.Tawk_API && typeof window.Tawk_API.shutdown === 'function') {
      try {
        window.Tawk_API.shutdown()
      } catch (_error) {
        // Ignore third-party cleanup failures.
      }
    }

    delete window.Tawk_API
    delete window.Tawk_LoadStart
  }, [])

  useEffect(() => {
    const container = soundToggleLottieRef.current
    if (!container) {
      return undefined
    }

    const instance = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/lottieflow-play-09-ffffff-easey.json',
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    })

    instance.setSpeed(0.9)
    soundToggleLottieInstanceRef.current = instance

    return () => {
      soundToggleLottieInstanceRef.current = null
      instance.destroy()
    }
  }, [])

  useEffect(() => {
    const instance = soundToggleLottieInstanceRef.current
    if (!instance) {
      return
    }

    if (soundEnabled) {
      instance.play()
      return
    }

    instance.pause()
  }, [soundEnabled])

  useEffect(() => {
    const audio = audioElementRef.current
    if (!audio) {
      return undefined
    }

    if (!soundEnabled) {
      audio.pause()
      audio.muted = true
      return undefined
    }

    audio.loop = true
    audio.volume = 0.35
    audio.preload = 'auto'

    const playMuted = async () => {
      audio.muted = true
      try {
        await audio.play()
      } catch (_error) {
        // Some browsers may block all autoplay attempts.
      }
    }

    const playAudible = async () => {
      audio.muted = false
      try {
        await audio.play()
        return true
      } catch (_error) {
        return false
      }
    }

    const startPlayback = async () => {
      const audibleStarted = await playAudible()
      if (!audibleStarted) {
        await playMuted()
      }
    }

    const onFirstGesture = () => {
      void playAudible()
    }

    const onCanPlay = () => {
      void startPlayback()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void startPlayback()
      }
    }

    void startPlayback()

    let retryAttempts = 0
    const retryIntervalId = window.setInterval(async () => {
      retryAttempts += 1
      const audibleStarted = await playAudible()
      if (audibleStarted || retryAttempts >= 15) {
        window.clearInterval(retryIntervalId)
      }
    }, 2000)

    audio.addEventListener('canplay', onCanPlay)
    window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true })
    window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true })
    window.addEventListener('keydown', onFirstGesture, { once: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(retryIntervalId)
      audio.removeEventListener('canplay', onCanPlay)
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('touchstart', onFirstGesture)
      window.removeEventListener('keydown', onFirstGesture)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [soundEnabled])

  const cartItems = useMemo(
    () =>
      products
        .filter((item) => cart[item.id])
        .map((item) => ({
          ...item,
          quantity: cart[item.id],
          lineTotal: cart[item.id] * item.price,
        })),
    [cart],
  )

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItems],
  )

  const addToCart = useCallback((id) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }))
  }, [])

  const triggerAddButtonFeedback = useCallback((id) => {
    setRecentlyAddedMap((prev) => ({
      ...prev,
      [id]: true,
    }))

    const existingTimeoutId = addButtonTimeoutsRef.current[id]
    if (existingTimeoutId) {
      window.clearTimeout(existingTimeoutId)
    }

    addButtonTimeoutsRef.current[id] = window.setTimeout(() => {
      setRecentlyAddedMap((prev) => {
        const { [id]: _removed, ...rest } = prev
        return rest
      })
      delete addButtonTimeoutsRef.current[id]
    }, 360)
  }, [])

  const handleAddToCart = useCallback((id) => {
    addToCart(id)
    triggerAddButtonFeedback(id)
  }, [addToCart, triggerAddButtonFeedback])

  const incrementItem = useCallback((id) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }))
  }, [])

  const decrementItem = useCallback((id) => {
    setCart((prev) => {
      const nextQty = (prev[id] || 0) - 1
      if (nextQty <= 0) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [id]: nextQty,
      }
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart({})
  }, [])

  const handleCustomerChange = useCallback((event) => {
    const { name, value } = event.target
    setCustomer((prev) => ({ ...prev, [name]: value }))
  }, [])

  const canSendInquiry = cartItems.length > 0 && customer.name.trim() && customer.phone.trim()

  const showStatusPopup = (title, message, isSuccess) => {
    setStatusPopup({
      isOpen: true,
      title,
      message,
      isSuccess,
    })
  }

  const closeStatusPopup = () => {
    setStatusPopup((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }

  const productCards = useMemo(
    () =>
      products.map((item, index) => (
        <ScrollStackItem key={item.id}>
          <article className={`product-card ${index % 2 === 1 ? 'reverse' : ''}`}>
            <div className="product-media">
              <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
            </div>
            <div className="product-body">
              <p className="meta">
                {item.category} . {item.stone} . {item.size}
              </p>
              <h3 className="product-name">{item.name}</h3>
              <p className="price">{inr.format(item.price)}</p>
              <p className="story">{item.story}</p>
              <button
                type="button"
                onClick={() => handleAddToCart(item.id)}
                className={recentlyAddedMap[item.id] ? 'is-added' : ''}
              >
                Add To Inquiry Cart
              </button>
            </div>
          </article>
        </ScrollStackItem>
      )),
    [handleAddToCart, recentlyAddedMap],
  )

  const sendInquiryViaFallback = async (payload) => {
    const response = await fetch(FORM_SUBMIT_FALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: `New Inquiry: ${payload.customer.name} (${payload.customer.phone})`,
        _captcha: 'false',
        _template: 'table',
        name: payload.customer.name,
        phone: payload.customer.phone,
        city: payload.customer.city || 'Not provided',
        notes: payload.customer.notes || 'None',
        total_estimate: inr.format(payload.subtotal),
        selected_items: payload.items
          .map(
            (item) =>
              `${item.name} x${item.quantity} (${item.category} | ${item.stone} | ${item.size}) = ${inr.format(item.lineTotal)}`,
          )
          .join('\n'),
        inquiry_message: payload.messagePreview,
      }),
    })

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success !== 'true') {
      const description = result?.message || `Fallback send failed (HTTP ${response.status}).`
      throw new Error(description)
    }
  }

  const sendInquiry = async () => {
    if (!canSendInquiry || isSendingInquiry) return

    const payload = {
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        city: customer.city.trim(),
        notes: customer.notes.trim(),
      },
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        stone: item.stone,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.lineTotal,
      })),
      subtotal,
      messagePreview: createInquiryMessage(customer, cartItems, subtotal),
    }

    try {
      setIsSendingInquiry(true)
      let delivered = false
      let lastError = ''

      try {
        const response = await fetch(INQUIRY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result.ok) {
          throw new Error(result.message || `Failed to send inquiry. (HTTP ${response.status})`)
        }

        delivered = true
        showStatusPopup(
          'Inquiry Sent Successfully',
          result.message || 'Your inquiry has been raised through email. We will contact you shortly.',
          true,
        )
      } catch (apiError) {
        lastError = String(apiError?.message || '')
      }

      if (!delivered) {
        try {
          await sendInquiryViaFallback(payload)
          delivered = true
          showStatusPopup(
            'Inquiry Sent Successfully',
            'Your inquiry has been raised through email. We will contact you shortly.',
            true,
          )
        } catch (fallbackError) {
          lastError = String(fallbackError?.message || lastError || 'Failed to send inquiry.')
        }
      }

      if (!delivered) {
        throw new Error(lastError || 'Failed to send inquiry.')
      }
    } catch (error) {
      const message = String(error?.message || '')
      if (message.toLowerCase().includes('failed to fetch')) {
        showStatusPopup('Unable To Send Inquiry', 'Unable to connect to inquiry services right now. Please try again.', false)
      } else {
        showStatusPopup('Unable To Send Inquiry', message || 'Unable to send inquiry right now. Please try again.', false)
      }
    } finally {
      setIsSendingInquiry(false)
    }
  }

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev)
  }

  const handleHeroTitleAnimationComplete = useCallback(() => {
    console.log('Animation completed!')
  }, [])

  return (
    <div className="app">
      <div className="silk-background" aria-hidden="true">
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <Silk
            speed={5}
            scale={1}
            color="#7B7481"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
      </div>

      {isIntroVisible && (
        <section className={`intro-screen ${isIntroExiting ? 'intro-screen-exit' : ''}`} aria-hidden={!isIntroVisible}>
          <div className="intro-content">
            <img src="/ganesh_recolored_f5ecdf.png" alt="Niraniya logo" className="intro-logo" />
            <h1 className="intro-title">Niraniya Heritage Stones - Jaipur</h1>
            <p className="intro-subtitle">Handcrafted Stone Idols and Sacred Storytelling by Mahendra Niraniya</p>
          </div>
        </section>
      )}

      <div className={`site-shell ${isIntroVisible ? 'site-shell-blur' : ''}`}>
        <ScrollFloat {...scrollFloatProps}>
          <header className="topbar">
            <div className="brand">
              <span className="brand-logo">
                <img src="/pngegg.png" alt="Ganesh logo" />
              </span>
              <div>
                <h1 className="brand-line">Niraniya Heritage Stones - Jaipur</h1>
                <p className="brand-subline">Handcrafted Stone Idols and Sacred Storytelling By Mahendra Niraniya</p>
              </div>
            </div>
          </header>
        </ScrollFloat>

        <div className="devotional-audio" aria-hidden="true">
          <audio
            ref={audioElementRef}
            src={DEVOTIONAL_TRACK_SRC}
            preload="auto"
            autoPlay
            loop
            playsInline
          />
          </div>

        <button
          type="button"
          className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Turn devotional sound off' : 'Turn devotional sound on'}
          title={soundEnabled ? 'Devotional Sound: On' : 'Devotional Sound: Off'}
        >
          <span className="sound-toggle-lottie" ref={soundToggleLottieRef} aria-hidden="true" />
          <span className="sound-toggle-label">{soundEnabled ? 'Devotional Sound On' : 'Devotional Sound Off'}</span>
        </button>

        <main>
          <ScrollFloat {...scrollFloatProps}>
            <section className="hero">
              <p className="hero-tag">A Sacred Collection from Jaipur Artisans</p>
              <BlurText
                text={HERO_TITLE_TEXT}
                delay={200}
                startDelay={HERO_TITLE_START_DELAY_MS}
                animateBy="words"
                direction="top"
                forceAnimation
                onAnimationComplete={handleHeroTitleAnimationComplete}
                className="hero-title hero-title-shiny"
                unitClassName="shiny-text"
              />
              <p className="hero-intro">
                We craft spiritually rooted stone idols where each piece includes a meaningful story to help families
                connect with devotion, culture, and intention.
              </p>
              <div className="hero-actions">
                <a href="#catalog">Explore Collection</a>
                <a href="#inquiry">Send Inquiry</a>
              </div>
            </section>
          </ScrollFloat>

          <ScrollFloat {...scrollFloatProps}>
            <section className="promise">
              <p className="promise-title">About Our Sacred Craft</p>
              <p className="promise-text">
                Our sales philosophy: a divine sculpture becomes truly valuable when people know the story, symbolism, and
                purpose behind it. Every listing below includes that heritage narrative.
              </p>
            </section>
          </ScrollFloat>

          <section className="catalog" id="catalog">
            <ScrollFloat {...scrollFloatProps}>
              <div className="section-head">
                <h2>Featured Stone Idols</h2>
                <p>Browse, add to cart, and send your inquiry directly on email.</p>
              </div>
            </ScrollFloat>
            <ScrollStack className="product-grid">
              {productCards}
            </ScrollStack>
          </section>

          <section className="cart-inquiry" id="inquiry">
            <ScrollFloat {...scrollFloatProps} className="scroll-float-panel">
              <div className="cart-card">
                <div className="section-head">
                  <h2>Your Cart</h2>
                  <p>{totalItems} item(s) selected for inquiry</p>
                </div>

                {cartItems.length === 0 ? (
                  <p className="empty">No idols selected yet. Add items from the collection above.</p>
                ) : (
                  <>
                    <ul className="cart-list">
                      {cartItems.map((item) => (
                        <li key={item.id}>
                          <div>
                            <p>{item.name}</p>
                            <span>{inr.format(item.lineTotal)}</span>
                          </div>
                          <div className="quantity">
                            <button type="button" onClick={() => decrementItem(item.id)}>
                              -
                            </button>
                            <strong>{item.quantity}</strong>
                            <button type="button" onClick={() => incrementItem(item.id)}>
                              +
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="cart-total">
                      <p>Total Estimate</p>
                      <strong>{inr.format(subtotal)}</strong>
                    </div>
                    <button type="button" className="clear-btn" onClick={clearCart}>
                      Clear Cart
                    </button>
                  </>
                )}
              </div>
            </ScrollFloat>

            <ScrollStack className="inquiry-stack">
              <ScrollStackItem>
                <form className="inquiry-card" onSubmit={(event) => event.preventDefault()}>
                  <div className="section-head">
                    <h2>Send Inquiry</h2>
                    <p>We receive your request on email for fast follow-up.</p>
                  </div>

                  <label htmlFor="name">Full Name</label>
                  <input id="name" name="name" value={customer.name} onChange={handleCustomerChange} required />

                  <label htmlFor="phone">Phone Number</label>
                  <input id="phone" name="phone" value={customer.phone} onChange={handleCustomerChange} required />

                  <label htmlFor="city">City</label>
                  <input id="city" name="city" value={customer.city} onChange={handleCustomerChange} />

                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={customer.notes}
                    onChange={handleCustomerChange}
                    rows="4"
                    placeholder="Share preferred size, stone, timeline, or temple/home use."
                  />

                  <div className="inquiry-actions">
                    <button
                      type="button"
                      onClick={sendInquiry}
                      disabled={!canSendInquiry || isSendingInquiry}
                    >
                      {isSendingInquiry ? 'Sending...' : 'Send Enquiry'}
                    </button>
                  </div>

                  <p className="contact-note">
                    No redirects. Customer stays on website and receives an email confirmation popup.
                  </p>
                </form>
              </ScrollStackItem>
            </ScrollStack>
          </section>
        </main>
      </div>

      {statusPopup.isOpen && (
        <div className="status-popup-backdrop" role="presentation" onClick={closeStatusPopup}>
          <section
            className="status-popup-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="status-popup-title"
              className={`status-popup-title ${statusPopup.isSuccess ? 'success' : 'error'}`}
            >
              {statusPopup.title}
            </p>
            <p className="status-popup-message">{statusPopup.message}</p>
            <p className="status-popup-contact">
              Need help? Call us at{' '}
              <a href={`tel:${ownerContactTel}`}>{ownerContactNumber}</a>
            </p>
            <button type="button" className="status-popup-close" onClick={closeStatusPopup}>
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
