;; Renter Verification Contract
;; Validates qualifications to operate equipment

(define-map verified-renters
  { renter: principal }
  {
    is-verified: bool,
    verification-expiry: uint,
    qualification-level: uint,
    verification-authority: principal
  }
)

(define-map verification-authorities
  { authority: principal }
  { is-active: bool }
)

(define-data-var contract-owner principal tx-sender)

(define-public (set-verification-authority (authority principal) (is-active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u1))
    (map-set verification-authorities
      { authority: authority }
      { is-active: is-active }
    )
    (ok true)
  )
)

(define-public (verify-renter
    (renter principal)
    (expiry uint)
    (qualification-level uint))
  (begin
    (asserts! (is-authority tx-sender) (err u2))
    (map-set verified-renters
      { renter: renter }
      {
        is-verified: true,
        verification-expiry: expiry,
        qualification-level: qualification-level,
        verification-authority: tx-sender
      }
    )
    (ok true)
  )
)

(define-read-only (is-authority (authority principal))
  (default-to false (get is-active (map-get? verification-authorities { authority: authority })))
)

(define-read-only (is-verified (renter principal))
  (let ((verification (map-get? verified-renters { renter: renter })))
    (if (is-some verification)
      (let ((verified (unwrap! verification false)))
        (and
          (get is-verified verified)
          (< block-height (get verification-expiry verified))
        )
      )
      false
    )
  )
)

(define-read-only (get-qualification-level (renter principal))
  (default-to u0 (get qualification-level (map-get? verified-renters { renter: renter })))
)
