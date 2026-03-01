import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const DEVOTIONAL_TRACK_SRC = '/devotional-track.mp3'

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
  const [introReady, setIntroReady] = useState(false)
  const [isSendingInquiry, setIsSendingInquiry] = useState(false)
  const [statusPopup, setStatusPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    isSuccess: true,
  })
  const audioElementRef = useRef(null)

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
    let rafOne = 0
    let rafTwo = 0

    setIntroReady(false)
    rafOne = window.requestAnimationFrame(() => {
      rafTwo = window.requestAnimationFrame(() => {
        setIntroReady(true)
      })
    })

    return () => {
      window.cancelAnimationFrame(rafOne)
      window.cancelAnimationFrame(rafTwo)
    }
  }, [])

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

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(retryIntervalId)
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

  const addToCart = (id) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }))
  }

  const incrementItem = (id) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }))
  }

  const decrementItem = (id) => {
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
  }

  const clearCart = () => {
    setCart({})
  }

  const handleCustomerChange = (event) => {
    const { name, value } = event.target
    setCustomer((prev) => ({ ...prev, [name]: value }))
  }

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
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Failed to send inquiry.')
      }

      showStatusPopup(
        'Inquiry Sent Successfully',
        result.message || 'Your inquiry has been raised through email. We will contact you shortly.',
        true,
      )
    } catch (error) {
      const message = String(error?.message || '')
      if (message.toLowerCase().includes('failed to fetch')) {
        showStatusPopup('Unable To Send Inquiry', 'Inquiry API is not running. Start app using "npm run dev" and try again.', false)
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

  return (
    <div className={`app ${introReady ? 'intro-ready' : ''}`}>
      <div className="live-wallpaper" aria-hidden="true">
        <span className="blend-wave" />
        <span className="wallpaper-orb orb-one" />
        <span className="wallpaper-orb orb-two" />
        <span className="wallpaper-orb orb-three" />
      </div>
      <div className="aura aura-one" />
      <div className="aura aura-two" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-logo brand-logo-entrance">
            <img src="/pngegg.png" alt="Ganesh logo" />
          </span>
          <div>
            <p className="brand-line brand-line-entrance">Niraniya Heritage Stones - Jaipur</p>
            <p className="brand-subline brand-subline-entrance">Handcrafted Stone Idols and Sacred Storytelling By Mahendra Niraniya</p>
          </div>
        </div>
        <button
          className={`sound-toggle toggle-entrance ${soundEnabled ? 'active' : ''}`}
          onClick={toggleSound}
          type="button"
        >
          {soundEnabled ? 'Devotional Track: On' : 'Devotional Track: Off'}
        </button>
      </header>

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

      <main>
        <section className="hero hero-entrance">
          <p className="hero-tag">A Sacred Collection from Jaipur Artisans</p>
          <h1 className="hero-title">
            <span className="title-line-left">Every Idol</span>
            <span className="title-line-right">Carries a Story,</span>
            <span className="title-line-left">Not Just a Price</span>
          </h1>
          <p className="hero-intro">
            We craft spiritually rooted stone idols where each piece includes a meaningful story to help families
            connect with devotion, culture, and intention.
          </p>
          <div className="hero-actions">
            <a href="#catalog">Explore Collection</a>
            <a href="#inquiry">Send Inquiry</a>
          </div>
        </section>

        <section className="promise promise-entrance">
          <p className="promise-title">About Our Sacred Craft</p>
          <p className="promise-text">
            Our sales philosophy: a divine sculpture becomes truly valuable when people know the story, symbolism, and
            purpose behind it. Every listing below includes that heritage narrative.
          </p>
        </section>

        <section className="catalog" id="catalog">
          <div className="section-head">
            <h2>Featured Stone Idols</h2>
            <p>Browse, add to cart, and send your inquiry directly on email.</p>
          </div>
          <div className="product-grid">
            {products.map((item) => (
              <article className="product-card" key={item.id}>
                <img src={item.image} alt={item.name} loading="lazy" />
                <div className="product-body">
                  <p className="meta">
                    {item.category} . {item.stone} . {item.size}
                  </p>
                  <h3>{item.name}</h3>
                  <p className="price">{inr.format(item.price)}</p>
                  <p className="story">{item.story}</p>
                  <button type="button" onClick={() => addToCart(item.id)}>
                    Add To Inquiry Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cart-inquiry" id="inquiry">
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
        </section>
      </main>

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
