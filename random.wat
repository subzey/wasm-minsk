(module
	(global $count (import "conf" "count") i32)
	(func $random (import "Math" "random") (result f32))

	(memory 1)

	(func (export "onframe")
		(local $ptr i32)
		(local $len i32)

		(set_local $len
			(i32.mul
				(get_global $count)
				(i32.const 16)
			)
		)
		(loop $each-point
			;; mem[$ptr + 0] = random() * 100
			(f32.store offset=0 (get_local $ptr)
				(f32.mul
					(call $random)
					(f32.const 100)
				)
			)

			;; mem[$ptr + 4] = random() * 100
			(f32.store offset=4 (get_local $ptr)
				(f32.mul
					(call $random)
					(f32.const 100)
				)
			)


			;; $ptr = $ptr + 16; _ = $ptr
			(tee_local $ptr
				(get_local $ptr)
				(i32.add (i32.const 16))
			)

			;; if (_ < $len) continue;
			(br_if $each-point
				(i32.lt_u
					(get_local $len)
				)
			)
		)
	)

	(export "mem" (memory 0))
)
